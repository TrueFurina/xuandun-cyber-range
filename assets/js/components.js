// ============================================================
// 玄盾 XUANDUN · 可视化与可复用组件
// Canvas 攻击态势图 / 折线·迷你图 / 流式终端日志 / 图标
// ============================================================

const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

function fitCanvas(canvas) {
  const r = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, Math.floor(r.width * DPR));
  canvas.height = Math.max(1, Math.floor(r.height * DPR));
  const ctx = canvas.getContext('2d');
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  return { ctx, w: r.width, h: r.height };
}

// —— 迷你 sparkline ——
export function sparkline(canvas, data, color) {
  const { ctx, w, h } = fitCanvas(canvas);
  ctx.clearRect(0, 0, w, h);
  if (!data || data.length < 2) return;
  const min = Math.min(...data), max = Math.max(...data);
  const span = max - min || 1;
  const px = (i) => (i / (data.length - 1)) * w;
  const py = (v) => h - 3 - ((v - min) / span) * (h - 6);
  // 面积
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, color + '44');
  grad.addColorStop(1, color + '00');
  ctx.beginPath(); ctx.moveTo(0, h);
  data.forEach((v, i) => ctx.lineTo(px(i), py(v)));
  ctx.lineTo(w, h); ctx.closePath(); ctx.fillStyle = grad; ctx.fill();
  // 线
  ctx.beginPath();
  data.forEach((v, i) => (i ? ctx.lineTo(px(i), py(v)) : ctx.moveTo(px(i), py(v))));
  ctx.strokeStyle = color; ctx.lineWidth = 1.6; ctx.lineJoin = 'round'; ctx.stroke();
}

// —— 大号折线图（奖励曲线）——
export function lineChart(canvas, data, color) {
  const { ctx, w, h } = fitCanvas(canvas);
  ctx.clearRect(0, 0, w, h);
  if (!data || data.length < 2) return;
  const min = Math.min(...data) - 0.02, max = Math.max(...data) + 0.02;
  const span = max - min || 1;
  const px = (i) => (i / (data.length - 1)) * w;
  const py = (v) => h - 6 - ((v - min) / span) * (h - 14);
  // 网格
  ctx.strokeStyle = 'rgba(120,140,170,0.10)'; ctx.lineWidth = 1;
  for (let g = 1; g < 4; g++) { const y = (h / 4) * g; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, color + '40'); grad.addColorStop(1, color + '00');
  ctx.beginPath(); ctx.moveTo(0, h);
  data.forEach((v, i) => ctx.lineTo(px(i), py(v)));
  ctx.lineTo(w, h); ctx.closePath(); ctx.fillStyle = grad; ctx.fill();
  ctx.beginPath();
  data.forEach((v, i) => (i ? ctx.lineTo(px(i), py(v)) : ctx.moveTo(px(i), py(v))));
  ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.stroke();
}

// —— 攻击态势图 ——
export class AttackMap {
  constructor(canvas, nodes) {
    this.canvas = canvas; this.nodes = nodes; this.arcs = []; this.raf = null;
    this.colorMap = { RED: '#FF4D6D', BLUE: '#38BDF8' };
    this._loop = this._loop.bind(this);
    this._onVis = () => {
      if (document.hidden) { if (this.raf) { cancelAnimationFrame(this.raf); this.raf = null; } }
      else if (!this.raf && this.arcs.length) { this.raf = requestAnimationFrame(this._loop); }
    };
    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('visibilitychange', this._onVis);
    this.raf = requestAnimationFrame(this._loop);
  }
  resize() { this._dims = fitCanvas(this.canvas); }
  fire(srcId, dstId, side) {
    if (srcId === dstId) return;
    this.arcs.push({ src: srcId, dst: dstId, color: this.colorMap[side] || '#2DE1A0', t: 0 });
    if (this.arcs.length > 14) this.arcs.shift();
    if (!this.raf && !document.hidden) this.raf = requestAnimationFrame(this._loop);
  }
  _loop() {
    const { ctx, w, h } = this._dims;
    ctx.clearRect(0, 0, w, h);
    const P = 26;
    const pos = (n) => ({ x: P + n.x * (w - 2 * P), y: P + n.y * (h - 2 * P) });
    // 节点
    this.nodes.forEach((n) => {
      const p = pos(n);
      ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#2DE1A0'; ctx.shadowColor = '#2DE1A0'; ctx.shadowBlur = 10; ctx.fill();
      ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.arc(p.x, p.y, 11, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(45,225,160,0.25)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = 'rgba(138,148,166,0.85)'; ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'center'; ctx.fillText(n.label, p.x, p.y - 16);
    });
    // 弧线
    this.arcs.forEach((a) => {
      const s = this.nodes.find((n) => n.id === a.src), d = this.nodes.find((n) => n.id === a.dst);
      if (!s || !d) return;
      const ps = pos(s), pd = pos(d);
      const hx = ps.x + (pd.x - ps.x) * a.t, hy = ps.y + (pd.y - ps.y) * a.t;
      ctx.strokeStyle = a.color + '66'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(ps.x, ps.y); ctx.lineTo(hx, hy); ctx.stroke();
      ctx.beginPath(); ctx.arc(hx, hy, 3.2, 0, Math.PI * 2);
      ctx.fillStyle = a.color; ctx.shadowColor = a.color; ctx.shadowBlur = 8; ctx.fill(); ctx.shadowBlur = 0;
      a.t += 0.018;
    });
    this.arcs = this.arcs.filter((a) => a.t < 1);
    // 无活动弧线时进入空闲，停止动画循环以省 CPU
    if (this.arcs.length > 0 && !document.hidden) {
      this.raf = requestAnimationFrame(this._loop);
    } else {
      this.raf = null;
    }
  }
  destroy() { if (this.raf) cancelAnimationFrame(this.raf); window.removeEventListener('visibilitychange', this._onVis); }
}

// —— 流式终端日志 ——
export class TerminalLog {
  constructor(el, max = 12) { this.el = el; this.max = max; }
  push(ev) {
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML =
      `<span class="ts">[${ev.time}]</span>` +
      `<span class="side ${ev.side}">${ev.side}</span>` +
      `<span>${ev.from} → ${ev.to}</span>` +
      `<span class="muted">${ev.cn}</span>` +
      `<span class="res ${ev.resCls}">${ev.result}</span>`;
    this.el.appendChild(row);
    while (this.el.children.length > this.max) this.el.removeChild(this.el.firstChild);
  }
}

// —— 侧栏图标 (SVG) ——
export const ICONS = {
  overview: '<svg viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.5"/></svg>',
  range: '<svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="8" r="2" fill="currentColor"/></svg>',
  drill: '<svg viewBox="0 0 16 16" fill="none"><path d="M3 3L13 13M13 3L3 13" stroke="currentColor" stroke-width="1.5"/></svg>',
  red: '<svg viewBox="0 0 16 16" fill="none"><path d="M8 2L13 4V8C13 11 11 13 8 14C5 13 3 11 3 8V4L8 2Z" stroke="currentColor" stroke-width="1.5"/></svg>',
  blue: '<svg viewBox="0 0 16 16" fill="none"><path d="M8 2L13 4V8C13 11 11 13 8 14C5 13 3 11 3 8V4L8 2Z" stroke="currentColor" stroke-width="1.5"/></svg>',
  rank: '<svg viewBox="0 0 16 16" fill="none"><path d="M3 13V8M8 13V4M13 13V10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  search: '<svg viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="currentColor" stroke-width="1.5"/><path d="M10.5 10.5L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  bell: '<svg viewBox="0 0 18 18" fill="none"><path d="M9 2C6.5 2 5 3.8 5 6V10L3.5 12H14.5L13 10V6C13 3.8 11.5 2 9 2Z" stroke="currentColor" stroke-width="1.3"/><path d="M7.3 14.2C7.4 15.1 8.1 15.6 9 15.6C9.9 15.6 10.6 15.1 10.7 14.2" stroke="currentColor" stroke-width="1.3"/></svg>',
};
