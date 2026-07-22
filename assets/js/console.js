// ============================================================
// 玄盾 XUANDUN · 控制台视图 (外壳 + 6 个路由视图)
// ============================================================
import { store } from './store.js';
import { ICONS, AttackMap, TerminalLog, sparkline, lineChart } from './components.js';

const COLORS = { green: '#2DE1A0', cyan: '#38BDF8', red: '#FF4D6D', orange: '#F5A623' };
const colorOf = (c) => COLORS[c] || '#2DE1A0';

// —— 抽屉 / 弹层基础设施 ——
function openDrawer(html) {
  closeDrawer();
  const backdrop = document.createElement('div');
  backdrop.className = 'drawer-backdrop';
  backdrop.addEventListener('click', closeDrawer);
  const panel = document.createElement('div');
  panel.className = 'drawer';
  panel.innerHTML = '<button class="drawer-close" aria-label="关闭">✕</button>' + html;
  panel.querySelector('.drawer-close').addEventListener('click', closeDrawer);
  document.body.appendChild(backdrop);
  document.body.appendChild(panel);
  requestAnimationFrame(() => { backdrop.classList.add('show'); panel.classList.add('show'); });
}
function closeDrawer() {
  document.querySelectorAll('.drawer-backdrop, .drawer').forEach((el) => el.remove());
}

const NAV = [
  { key: 'overview', label: '总览', icon: ICONS.overview },
  { key: 'ranges', label: '靶场环境', icon: ICONS.range },
  { key: 'drills', label: '对抗演练', icon: ICONS.drill },
  { key: 'red', label: 'AI红队', icon: ICONS.red },
  { key: 'blue', label: 'AI蓝队', icon: ICONS.blue },
  { key: 'rank', label: '排行榜', icon: ICONS.rank },
];

let currentCleanup = null;
let offClk = null;
export function teardownConsole() {
  if (currentCleanup) { currentCleanup(); currentCleanup = null; }
  if (offClk) { offClk(); offClk = null; }
  closeDrawer();
}

// ---------- 复用片段 ----------
function kpiCard(key, m) {
  return `<div class="kpi panel" data-k="${key}">
    <span class="bar" style="background:${colorOf(m.color)}"></span>
    <div class="label"><span class="dot ${m.color}"></span>${m.label}</div>
    <div class="value" style="color:${colorOf(m.color)}">${m.value}<span class="u">${m.unit}</span></div>
    <div class="delta ${m.delta >= 0 ? 'green' : 'red'}">${m.delta >= 0 ? '▲' : '▼'} ${Math.abs(m.delta)}</div>
    <canvas class="spark"></canvas>
  </div>`;
}
function lbTable(rows) {
  return `<table class="tbl"><thead><tr><th>排名</th><th>战队</th><th>类型</th><th>胜率</th><th>积分</th></tr></thead><tbody>
    ${rows.map((r) => `<tr><td class="rank r${r.rank <= 3 ? r.rank : ''}">${r.rank}</td><td><b>${r.name}</b></td><td><span class="tag ${r.type === '红队' ? 'red' : 'cyan'}">${r.type}</span></td><td class="mono">${r.winRate}%</td><td class="score">${r.score.toLocaleString()}</td></tr>`).join('')}
    </tbody></table>`;
}

// ---------- 抽屉内容 ----------
function targetDetail(r) {
  if (!r) return '<p class="muted">未找到靶机</p>';
  const tag = r.status === '在线' ? 'green' : r.status === '演练中' ? 'orange' : 'lo';
  return `
    <div class="drawer-head"><h2>${r.name}</h2><span class="tag ${tag}">${r.status}</span></div>
    <div class="drawer-meta">
      <div class="kv"><span>操作系统</span><b>${r.os}</b></div>
      <div class="kv"><span>难度</span><b>${r.difficulty}</b></div>
      <div class="kv"><span>部署智能体</span><b>${r.agents}</b></div>
      <div class="kv"><span>健康分</span><b style="color:${r.score >= 80 ? 'var(--accent)' : 'var(--orange)'}">${r.score}</b></div>
    </div>
    <h4 class="drawer-sub">暴露面与脆弱性（模拟评估）</h4>
    <ul class="vuln-list">
      <li><span class="dot red"></span> CVE-2024-3${Math.floor(r.score * 97)} · 远程代码执行 · 高危</li>
      <li><span class="dot orange"></span> 开放端口 22 / 3389 · 横向移动风险</li>
      <li><span class="dot ${tag === 'green' ? 'green' : 'orange'}"></span> EDR 检测${r.status === '在线' ? '已启用 · 基线达标' : '待校准'}</li>
      <li><span class="dot green"></span> 流量镜像就绪 · 可用于演练回放</li>
    </ul>
    <div class="drawer-actions">
      <button class="btn btn-primary" data-act="launch">发起对抗演练</button>
      <button class="btn btn-ghost" data-act="clone">克隆靶机</button>
    </div>`;
}
function drillTimeline(d) {
  if (!d) return '<p class="muted">未找到演练</p>';
  const redActs = ['SQLi 探测入口', '暴力破解账密', '权限提升', '横向移动', '钓鱼投递', '建立 C2 信道'];
  const blueActs = ['流量隔离网段', '异常行为检测', '漏洞热修补', '策略拦截', '模型重训', '攻击溯源'];
  const n = Math.min(d.rounds, 14);
  let html = `<div class="drawer-head"><h2>${d.name}</h2><span class="tag ${d.status === '进行中' ? 'green' : d.status === '复盘' ? 'cyan' : 'lo'}">${d.status}</span></div>
    <div class="drawer-meta">
      <div class="kv"><span>红队</span><b class="red">${d.red}</b></div>
      <div class="kv"><span>蓝队</span><b class="cyan">${d.blue}</b></div>
      <div class="kv"><span>总回合</span><b>${d.rounds}</b></div>
      <div class="kv"><span>进度</span><b>${d.progress}%</b></div>
    </div>
    <h4 class="drawer-sub">回合时间轴（回放）</h4><ul class="timeline">`;
  for (let i = 1; i <= n; i++) {
    const isRed = i % 2 === 1;
    const acts = isRed ? redActs : blueActs;
    const act = acts[(i - 1) % acts.length];
    const mm = String(Math.floor(i / 4)).padStart(2, '0');
    const ss = String((i % 4) * 15).padStart(2, '0');
    html += `<li class="${isRed ? 'RED' : 'BLUE'}"><b>[R${i} · ${mm}:${ss}]</b> ${isRed ? '🔴' : '🔵'} ${act}</li>`;
  }
  html += '</ul><div class="drawer-actions"><button class="btn btn-ghost" data-act="export">导出复盘报告</button></div>';
  return html;
}
function comparePanel(side) {
  const other = side === 'red' ? 'blue' : 'red';
  const ot = store.get().teams[other];
  const avgReward = (ot.reduce((s, t) => s + t.reward, 0) / ot.length).toFixed(3);
  const avgEp = Math.round(ot.reduce((s, t) => s + t.episodes, 0) / ot.length);
  const policies = [...new Set(ot.map((t) => t.policy))].join(' / ');
  return `<div class="cmp panel">
    <div class="cmp-head"><span class="dot ${other === 'red' ? 'red' : 'cyan'}"></span>对手态势 · ${other === 'red' ? '红队' : '蓝队'}</div>
    <div class="cmp-grid">
      <div class="kv"><span>平均奖励</span><b>${avgReward}</b></div>
      <div class="kv"><span>平均训练局</span><b>${avgEp.toLocaleString()}</b></div>
      <div class="kv"><span>主流策略</span><b>${policies}</b></div>
    </div>
    <div class="cmp-note">策略对比建议：针对对手 ${policies} 特征，调整本方奖励塑形与对手课程难度。</div>
  </div>`;
}

// ---------- 视图 ----------
function viewOverview(content) {
  content.innerHTML = `
    <div class="page-head"><div><h1>总览</h1><p>实时监测靶场全局态势与 AI 红蓝队对抗</p></div><div class="tag green"><span class="dot green"></span>实时</div></div>
    <div class="kpi-row" id="kpiRow"></div>
    <div class="mid-row">
      <div class="panel">
        <div class="panel-head"><h3>实时对抗态势</h3><div class="legend"><span><span class="dot red"></span>红队</span><span><span class="dot cyan"></span>蓝队</span></div></div>
        <div class="panel-body"><div class="map-wrap"><canvas id="attackMap"></canvas></div></div>
      </div>
      <div class="panel">
        <div class="panel-head"><h3>AI 红蓝队状态</h3></div>
        <div class="panel-body" id="teamStatus"></div>
      </div>
    </div>
    <div class="panel">
      <div class="panel-head"><h3>攻防排行榜 · TOP 5</h3><a href="#/rank" class="tag green">查看全部 →</a></div>
      <div class="panel-body" style="padding:0"><div id="lbMini"></div></div>
    </div>
    <div class="panel" style="margin-top:16px">
      <div class="panel-head"><h3>实时对抗日志</h3></div>
      <div class="panel-body"><div class="log" id="logFeed"></div></div>
    </div>`;

  const kpiRow = content.querySelector('#kpiRow');
  Object.entries(store.get().kpis).forEach(([key, m]) => kpiRow.insertAdjacentHTML('beforeend', kpiCard(key, m)));
  content.querySelectorAll('.kpi').forEach((card) => {
    const m = store.get().kpis[card.dataset.k];
    sparkline(card.querySelector('.spark'), m.hist, colorOf(m.color));
  });

  const map = new AttackMap(content.querySelector('#attackMap'), store.get().nodes);
  const term = new TerminalLog(content.querySelector('#logFeed'));
  store.get().log.slice(-12).forEach((ev) => term.push(ev));

  const renderTeams = (t) => {
    const card = (a) => `<div class="team-card ${a.color}"><div class="th"><span class="dot ${a.color}"></span><b>${a.name}</b></div>
      <div class="kv"><span>状态</span><b style="color:var(--${a.color})">${a.status}</b></div>
      <div class="kv"><span>训练局数</span><b>${a.episodes.toLocaleString()}</b></div>
      <div class="kv"><span>平均奖励</span><b>${a.reward.toFixed(3)}</b></div>
      <div class="kv"><span>策略</span><b>${a.policy}</b></div>
      <div class="prog ${a.color}"><i style="width:${Math.min(100, a.episodes / 15)}%"></i></div></div>`;
    content.querySelector('#teamStatus').innerHTML = card(t.red[0]) + card(t.blue[0]);
  };
  renderTeams(store.get().teams);
  content.querySelector('#lbMini').innerHTML = lbTable(store.get().leaderboard.slice(0, 5));

  const offKpi = store.on('kpi', (k) => content.querySelectorAll('.kpi').forEach((card) => {
    const m = k[card.dataset.k]; if (!m) return;
    card.querySelector('.value').innerHTML = `${m.value}<span class="u">${m.unit}</span>`;
    sparkline(card.querySelector('.spark'), m.hist, colorOf(m.color));
  }));
  const offEv = store.on('event', (ev) => { map.fire(ev.srcId, ev.dstId, ev.side); term.push(ev); });
  const offTeams = store.on('teams', renderTeams);
  const offLb = store.on('leaderboard', (lb) => { content.querySelector('#lbMini').innerHTML = lbTable(lb.slice(0, 5)); });

  return () => { offKpi(); offEv(); offTeams(); offLb(); map.destroy(); };
}

function viewRanges(content) {
  content.innerHTML = `<div class="page-head"><div><h1>靶场环境</h1><p>异构靶机池 · 实时状态（点击查看详情）</p></div><div class="tag cyan"><span class="dot cyan"></span>${store.get().ranges.length} 台靶机</div></div><div class="cards" id="rangeCards"></div>`;
  const el = content.querySelector('#rangeCards');
  const render = () => {
    el.innerHTML = store.get().ranges.map((r) => {
      const cls = r.status === '在线' ? 'green' : r.status === '演练中' ? 'orange' : 'lo';
      return `<div class="card panel clickable" data-id="${r.id}"><div class="ch"><b>${r.name}</b><span class="tag ${cls}">${r.status}</span></div>
        <div class="meta">
          <div class="kv"><span>系统</span><b>${r.os}</b></div>
          <div class="kv"><span>难度</span><b>${r.difficulty}</b></div>
          <div class="kv"><span>部署智能体</span><b>${r.agents}</b></div>
          <div class="kv"><span>健康分</span><b>${r.score}</b></div>
        </div><div class="prog"><i style="width:${r.score}%"></i></div></div>`;
    }).join('');
    el.querySelectorAll('.card').forEach((c) => c.addEventListener('click', () => openDrawer(targetDetail(store.get().ranges.find((x) => x.id === c.dataset.id)))));
  };
  render();
  return store.on('ranges', render);
}

function viewDrills(content) {
  content.innerHTML = `<div class="page-head"><div><h1>对抗演练</h1><p>进行中的红蓝对抗会话（点击查看回合时间轴）</p></div><div class="tag orange"><span class="dot orange"></span>${store.get().drills.filter((d) => d.status === '进行中').length} 进行中</div></div><div class="cards" id="drillCards"></div>`;
  const el = content.querySelector('#drillCards');
  const render = () => {
    el.innerHTML = store.get().drills.map((d) => {
      const cls = d.status === '进行中' ? 'green' : d.status === '复盘' ? 'cyan' : 'lo';
      return `<div class="card panel clickable" data-id="${d.id}"><div class="ch"><b>${d.name}</b><span class="tag ${cls}">${d.status}</span></div>
        <div class="meta">
          <div class="kv"><span>红队</span><b class="red">${d.red}</b></div>
          <div class="kv"><span>蓝队</span><b class="cyan">${d.blue}</b></div>
          <div class="kv"><span>回合</span><b>${d.rounds}</b></div>
        </div>
        <div class="prog"><i style="width:${d.progress}%;background:linear-gradient(90deg,var(--accent-dim),var(--accent))"></i></div>
        <div class="lo mono" style="font-size:11px;margin-top:6px">进度 ${d.progress}%</div></div>`;
    }).join('');
    el.querySelectorAll('.card').forEach((c) => c.addEventListener('click', () => openDrawer(drillTimeline(store.get().drills.find((x) => x.id === c.dataset.id)))));
  };
  render();
  return store.on('drills', render);
}

function viewTeam(content, side) {
  const list = store.get().teams[side];
  const color = side === 'red' ? 'red' : 'cyan';
  content.innerHTML = `<div class="page-head"><div><h1>${side === 'red' ? 'AI 红队' : 'AI 蓝队'}</h1><p>多智能体强化学习对抗训练 · ${list.length} 个智能体</p></div><div class="tag ${color}"><span class="dot ${color}"></span>训练中</div></div><div class="cards" id="teamCards"></div><div id="cmpBox"></div>`;
  const el = content.querySelector('#teamCards');
  const cmpBox = content.querySelector('#cmpBox');
  const render = () => {
    el.innerHTML = list.map((t) => `<div class="card panel"><div class="ch"><b>${t.name}</b><span class="tag ${color}">${t.status}</span></div>
      <div class="meta">
        <div class="kv"><span>代练智能体</span><b>${t.agent}</b></div>
        <div class="kv"><span>策略</span><b>${t.policy}</b></div>
        <div class="kv"><span>训练局数</span><b>${t.episodes.toLocaleString()}</b></div>
        <div class="kv"><span>平均奖励</span><b style="color:var(--${color})">${t.reward.toFixed(3)}</b></div>
      </div><canvas class="chart" data-id="${t.id}"></canvas>
      <div class="prog ${color}"><i style="width:${Math.min(100, t.episodes / 15)}%"></i></div></div>`).join('');
    el.querySelectorAll('.chart').forEach((cv) => {
      const t = list.find((x) => x.id === cv.dataset.id);
      lineChart(cv, t.hist, colorOf(color));
    });
    cmpBox.innerHTML = comparePanel(side);
  };
  render();
  const off = store.on('teams', render);
  return () => { off(); };
}

function viewLeaderboard(content) {
  let filter = 'all';
  content.innerHTML = `<div class="page-head"><div><h1>攻防排行榜</h1><p>按积分排名的战队效能榜</p></div></div>
    <div class="tabs" id="lbTabs"><button class="tab active" data-f="all">全部</button><button class="tab" data-f="红队">红队</button><button class="tab" data-f="蓝队">蓝队</button></div>
    <div class="panel"><div class="panel-body" style="padding:0" id="lbFull"></div></div>`;
  const tabs = content.querySelector('#lbTabs');
  const el = content.querySelector('#lbFull');
  const render = () => { el.innerHTML = lbTable(store.get().leaderboard.filter((r) => filter === 'all' || r.type === filter)); };
  tabs.addEventListener('click', (e) => {
    const b = e.target.closest('.tab'); if (!b) return;
    filter = b.dataset.f; tabs.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t === b)); render();
  });
  render();
  return store.on('leaderboard', render);
}

const VIEWS = {
  overview: viewOverview, ranges: viewRanges, drills: viewDrills,
  red: (c) => viewTeam(c, 'red'), blue: (c) => viewTeam(c, 'blue'), rank: viewLeaderboard,
};

// ---------- 外壳 ----------
export function mountConsole(root) {
  root.innerHTML = `
    <div class="console">
      <aside class="sidebar">
        <div class="sb-brand"><span class="mark">玄</span><div><b>玄盾</b><small>XUANDUN</small></div></div>
        <div class="sb-divider"></div>
        <nav class="sb-nav">
          ${NAV.map((n) => `<a class="sb-item" data-route="${n.key}">${n.icon}<span>${n.label}</span></a>`).join('')}
        </nav>
        <div class="sb-spacer"></div>
        <div class="sb-foot"><div class="av">张</div><div class="meta"><b>张敏杰</b><span>安全研究员</span></div></div>
      </aside>
      <main class="main">
        <div class="topbar">
          <button class="menu-btn" id="menuBtn" aria-label="打开菜单">☰</button>
          <div class="search">${ICONS.search}<input placeholder="搜索靶机 / 演练 / 用户..." /></div>
          <div class="tb-right"><span class="clock" id="clk">--:--:--</span><div class="bell">${ICONS.bell}<span class="badge"></span></div><div class="avatar">张</div></div>
        </div>
        <div class="content" id="consoleContent"></div>
      </main>
    </div>`;

  const sb = root.querySelector('.sidebar');
  const sbBackdrop = document.createElement('div');
  sbBackdrop.className = 'sb-backdrop';
  root.querySelector('.main').appendChild(sbBackdrop);

  const closeSb = () => { sb.classList.remove('open'); sbBackdrop.classList.remove('show'); };
  root.querySelector('#menuBtn').addEventListener('click', () => { sb.classList.toggle('open'); sbBackdrop.classList.toggle('show'); });
  sbBackdrop.addEventListener('click', closeSb);

  const navEls = [...root.querySelectorAll('.sb-item')];
  const contentEl = root.querySelector('#consoleContent');
  const clk = root.querySelector('#clk');
  navEls.forEach((el) => el.addEventListener('click', () => { location.hash = '#/' + el.dataset.route; closeSb(); }));
  offClk = store.on('clock', (d) => { clk.textContent = d.toTimeString().slice(0, 8); });

  function show(route) {
    if (currentCleanup) currentCleanup();
    currentCleanup = null;
    navEls.forEach((el) => el.classList.toggle('active', el.dataset.route === route));
    contentEl.innerHTML = '';
    try {
      const v = VIEWS[route] || VIEWS.overview;
      currentCleanup = v(contentEl) || null;
    } catch (e) {
      console.error('[玄盾] 视图渲染失败:', e);
      contentEl.innerHTML = '<div class="view-error">视图加载失败：' + (e && e.message ? e.message : e) + '<br/>请刷新页面重试。</div>';
    }
    contentEl.scrollTop = 0;
  }
  return { show };
}
