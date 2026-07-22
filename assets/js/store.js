// ============================================================
// 玄盾 XUANDUN · 数据服务层 (Data Service Layer)
// 中央状态 + 发布订阅总线 + 实时模拟引擎
// 商业级架构：模拟层可整体替换为真实 REST/WebSocket 后端。
// ============================================================

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function seedHistory(base, vol, n = 24) {
  const out = [];
  let v = base;
  for (let i = 0; i < n; i++) { v = clamp(v + rnd(-vol, vol), base * 0.5, base * 1.5); out.push(+v.toFixed(2)); }
  return out;
}

// —— 靶机节点（攻击态势图坐标，归一化 0~1）——
const NODES = [
  { id: 'gw',   label: 'GATEWAY', x: 0.5,  y: 0.12 },
  { id: 'a',    label: 'node-A',  x: 0.2,  y: 0.36 },
  { id: 'b',    label: 'node-B',  x: 0.8,  y: 0.36 },
  { id: 'c',    label: 'node-C',  x: 0.34, y: 0.62 },
  { id: 'd',    label: 'node-D',  x: 0.66, y: 0.62 },
  { id: 'db',   label: 'db-core', x: 0.5,  y: 0.86 },
  { id: 'auth', label: 'auth-svc',x: 0.14, y: 0.78 },
  { id: 'api',  label: 'api-svc', x: 0.86, y: 0.78 },
];

const RED_ACTIONS = [
  ['SQLi', '数据库注入'], ['PortScan', '端口探测'], ['BruteForce', '暴力破解'],
  ['XSS', '跨站脚本'], ['PrivEsc', '权限提升'], ['RCE', '远程执行'], ['Phishing', '钓鱼投递'],
];
const BLUE_ACTIONS = [
  ['Patch', '漏洞修补'], ['Harden', '基线加固'], ['Detect', '异常检测'],
  ['Isolate', '流量隔离'], ['Block', '策略拦截'], ['Retrain', '模型重训'],
];

function makeTeam(prefix, count, color) {
  const names = ['破壁', '磐石', '影刃', '铁壁', '夜枭', '苍狼', '赤狐', '玄武'];
  const out = [];
  for (let i = 0; i < count; i++) {
    const ep = Math.floor(rnd(900, 1400));
    out.push({
      id: `${prefix}-${String(i + 1).padStart(2, '0')}`,
      name: `${prefix === 'RED' ? '红队' : '蓝队'} · ${prefix}-${String(i + 1).padStart(2, '0')}`,
      agent: `${names[i % names.length]}${pick(['', '·α', '·β'])}`,
      episodes: ep,
      reward: +rnd(0.6, 0.9).toFixed(2),
      hist: seedHistory(rnd(0.6, 0.85), 0.06, 30),
      status: pick([prefix === 'RED' ? '对抗训练中' : '防御推演中', '策略评估中', '样本采集']),
      policy: pick(['PPO+Curiosity', 'MAPPO', 'QMIX', 'VDN', 'IQL']),
      color,
    });
  }
  return out;
}

function makeRanges() {
  const osList = ['Ubuntu 22.04', 'Windows Server 2019', 'CentOS 7', 'Debian 12', 'Kali 2024'];
  const diff = ['简单', '中等', '困难', '专家'];
  const labels = ['Web 靶机', '域控靶机', '数据库靶机', 'OT/ICS 靶机', '云原生靶机', '容器靶机', '无线靶机', '工控 PLC', 'API 网关'];
  return labels.map((l, i) => ({
    id: `R-${100 + i}`,
    name: l,
    os: pick(osList),
    difficulty: pick(diff),
    status: pick(['在线', '在线', '演练中', '维护中']),
    agents: Math.floor(rnd(0, 4)),
    score: Math.floor(rnd(60, 98)),
  }));
}

function makeDrills() {
  const red = ['红队·RED-01', '红队·RED-03', '红队·RED-05'];
  const blue = ['蓝队·BLUE-02', '蓝队·BLUE-04', '蓝队·BLUE-06'];
  const names = ['内网横向移动演练', 'Web 应用攻防', '勒索防护推演', 'APT 模拟对抗', '零信任验证', '云上逃逸演练'];
  return names.map((n, i) => ({
    id: `D-${200 + i}`,
    name: n,
    red: red[i % red.length],
    blue: blue[i % blue.length],
    progress: Math.floor(rnd(10, 95)),
    status: pick(['进行中', '进行中', '待开始', '复盘']),
    rounds: Math.floor(rnd(8, 40)),
  }));
}

function makeLeaderboard() {
  const teams = [
    ['玄盾·破壁', '红队'], ['玄盾·磐石', '蓝队'], ['影刃', '红队'], ['铁壁', '蓝队'],
    ['夜枭', '红队'], ['苍狼', '红队'], ['玄武', '蓝队'], ['赤狐', '红队'],
    ['砺剑', '蓝队'], ['疾风', '红队'],
  ];
  return teams
    .map(([name, type], i) => ({
      name, type,
      winRate: Math.floor(rnd(70, 90)),
      score: Math.floor(rnd(7800, 9500)),
      _i: i,
    }))
    .sort((a, b) => b.score - a.score)
    .map((t, i) => ({ ...t, rank: i + 1 }));
}

// —— 状态构造 ——
function buildState() {
  return {
    kpis: {
      onlineTargets:  { label: '在线靶机',   value: 128, unit: '',    delta: +12,   color: 'green', hist: seedHistory(128, 6) },
      activeDrills:   { label: '进行中演练', value: 14,  unit: '',    delta: +3,    color: 'cyan',  hist: seedHistory(14, 1.5) },
      redWinRate:     { label: '红队胜率',   value: 63,  unit: '%',   delta: -2.1,  color: 'red',   hist: seedHistory(63, 2) },
      avgConvergence: { label: '平均收敛',   value: 2.4, unit: 's',   delta: -0.3,  color: 'orange',hist: seedHistory(2.4, 0.2) },
    },
    nodes: NODES,
    log: [],
    teams: { red: makeTeam('RED', 4, 'red'), blue: makeTeam('BLUE', 4, 'cyan') },
    ranges: makeRanges(),
    drills: makeDrills(),
    leaderboard: makeLeaderboard(),
    clock: new Date(),
  };
}

// —— 事件总线 + Store ——
class Store {
  constructor() {
    this.state = buildState();
    this._subs = new Map();
  }
  on(evt, fn) {
    const g = (...a) => { try { return fn(...a); } catch (e) { console.error('[玄盾] 订阅回调异常:', e); } };
    if (!this._subs.has(evt)) this._subs.set(evt, new Set());
    this._subs.get(evt).add(g);
    return () => this._subs.get(evt).delete(g);
  }
  emit(evt, payload) {
    (this._subs.get(evt) || []).forEach((fn) => fn(payload, this.state));
  }
  get() { return this.state; }
}

// —— 实时模拟引擎 ——
function startSimulator(store) {
  // 后台标签暂停：避免隐藏页空跑定时器，省 CPU/电量
  const tick = (fn) => () => { if (typeof document !== 'undefined' && document.hidden) return; fn(); };
  // 时钟
  setInterval(tick(() => { store.state.clock = new Date(); store.emit('clock', store.state.clock); }), 1000);

  // 对抗事件流
  function tickEvent() {
    const side = Math.random() > 0.5 ? 'RED' : 'BLUE';
    const [en, cn] = side === 'RED' ? pick(RED_ACTIONS) : pick(BLUE_ACTIONS);
    const from = pick(NODES).label;
    const to = pick(NODES.filter((n) => n.label !== from)).label;
    const roll = Math.random();
    const result = side === 'RED'
      ? (roll > 0.6 ? 'BLOCKED' : roll > 0.3 ? 'DETECTED' : 'BREACH')
      : (roll > 0.5 ? 'OK' : roll > 0.25 ? 'MITIGATED' : 'ESCALATED');
    const resCls = result === 'BREACH' || result === 'ESCALATED' ? 'bad'
      : result === 'OK' || result === 'BLOCKED' || result === 'MITIGATED' ? 'ok' : 'warn';
    const ev = {
      time: store.state.clock.toTimeString().slice(0, 8),
      side, en, cn, from, to, result, resCls,
      srcId: NODES.find((n) => n.label === from).id,
      dstId: NODES.find((n) => n.label === to).id,
    };
    store.state.log.push(ev);
    if (store.state.log.length > 60) store.state.log.shift();

    // KPI 微扰
    const k = store.state.kpis;
    k.onlineTargets.value = clamp(k.onlineTargets.value + (Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0), 110, 140);
    k.activeDrills.value = clamp(k.activeDrills.value + (Math.random() > 0.85 ? (Math.random() > 0.5 ? 1 : -1) : 0), 8, 22);
    k.redWinRate.value = +clamp(k.redWinRate.value + rnd(-0.6, 0.6), 50, 75).toFixed(1);
    k.avgConvergence.value = +clamp(k.avgConvergence.value + rnd(-0.08, 0.08), 1.6, 3.4).toFixed(2);
    Object.values(k).forEach((m) => { m.hist.push(m.value); if (m.hist.length > 24) m.hist.shift(); });

    // 团队训练推进
    [store.state.teams.red, store.state.teams.blue].forEach((list) => {
      list.forEach((t) => {
        t.episodes += Math.floor(rnd(0, 3));
        const dr = rnd(-0.02, 0.025);
        t.reward = +clamp(t.reward + dr, 0.4, 0.98).toFixed(3);
        t.hist.push(t.reward); if (t.hist.length > 30) t.hist.shift();
      });
    });

    store.emit('event', ev);
    store.emit('kpi', k);
    store.emit('teams', store.state.teams);
  }

  // 排行榜轻量重排
  function tickLeaderboard() {
    store.state.leaderboard.forEach((t) => {
      t.score += Math.floor(rnd(-15, 22));
      t.winRate = clamp(t.winRate + Math.floor(rnd(-1, 2)), 60, 95);
    });
    store.state.leaderboard.sort((a, b) => b.score - a.score);
    store.state.leaderboard.forEach((t, i) => (t.rank = i + 1));
    store.emit('leaderboard', store.state.leaderboard);
  }

  // 靶机 / 演练状态漂移
  function tickStatus() {
    const r = pick(store.state.ranges);
    if (r) r.status = pick(['在线', '在线', '演练中', '维护中']);
    const d = pick(store.state.drills);
    if (d && d.status === '进行中') d.progress = clamp(d.progress + Math.floor(rnd(1, 6)), 0, 100);
    store.emit('ranges', store.state.ranges);
    store.emit('drills', store.state.drills);
  }

  setInterval(tick(tickEvent), 1100);
  setInterval(tick(tickLeaderboard), 5200);
  setInterval(tick(tickStatus), 3400);
}

export const store = new Store();
export { startSimulator };
