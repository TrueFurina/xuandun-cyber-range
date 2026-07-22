# 玄盾 XUANDUN · AI 攻防靶场系统

> 面向红蓝对抗训练的 **AI 攻防靶场系统**。基于多智能体强化学习（MARL）自动化生成、调度与评估攻防演练，让防御策略在真实对抗压力下持续进化。

暗色赛博安全风、纯中文、零构建依赖的**商业级前端 Web 应用**：产品落地页 + 实时数据驱动的控制台。内置实时模拟引擎，所有可视化（攻击态势图、流式日志、奖励曲线、排行榜）秒级刷新，可直接作为演示或对接真实后端。

---

## ✨ 特性

- **产品落地页**：Hero 动画终端、数字滚动统计、核心能力 / 工作原理 / 四层技术架构 / CTA。
- **实时控制台（6 视图）**：总览、靶场环境、对抗演练、AI 红队、AI 蓝队、排行榜，哈希路由切换。
- **实时可视化**：Canvas 攻击态势图（红蓝动态弧线）、流式终端日志、KPI sparkline、智能体奖励曲线大图。
- **交互增强**：
  - 移动端侧栏抽屉（汉堡菜单 + 遮罩）
  - 靶机详情抽屉（暴露面 / 脆弱性评估）
  - 演练回合时间轴回放
  - 红蓝队策略对比面板
- **工程健壮性**：
  - 数据服务层（`store.js`）与视图解耦，模拟器可整体替换为真实 REST/WebSocket 后端。
  - 后台标签页暂停模拟、攻击图空闲停帧（省 CPU）。
  - 订阅回调统一异常防护 + 视图错误边界 + 路由切换兜底。
  - 外部字体非阻塞加载，启动看门狗，出错显示可读提示而非无限转圈。
  - 焦点可见性、`prefers-reduced-motion` 可访问性支持。
- **离线单文件版**：`npm run build:offline` 生成 `dist/offline.html`（CSS/JS 全内联、零外部依赖）。

---

## 🧱 技术架构

```
index.html
├─ assets/css/tokens.css   # 设计令牌（暗色赛博风调色板 / 字体 / 间距）
├─ assets/css/app.css      # 全部样式（落地页 + 控制台 + 响应式）
└─ assets/js/
   ├─ store.js      # 数据服务层：中央状态 + 发布订阅总线 + 实时模拟引擎
   ├─ components.js  # 可视化与组件：AttackMap / sparkline / lineChart / TerminalLog / SVG 图标
   ├─ landing.js     # 产品落地页视图
   ├─ console.js     # 控制台外壳 + 6 个路由视图
   ├─ router.js      # 哈希路由（#/、#/console、#/overview|ranges|drills|red|blue|rank）
   └─ main.js        # 应用入口（启动 + 看门狗 + 错误兜底）
```

数据流：`store`（中央状态 + 事件总线）`→` 各类 `setInterval` 模拟器持续 `emit` `→` 视图通过 `store.on(evt, cb)` 订阅并实时刷新。`store.js` 是唯一与"数据来源"耦合的层——接真实后端时仅替换 `startSimulator` 内部实现即可，视图零改动。

---

## 🚀 本地运行

零依赖，用内置静态服务器：

```bash
npm run dev
# → http://localhost:8000
```

或任意静态服务器：

```bash
python -m http.server 8000
```

打开后：落地页点「进入控制台」查看实时仪表盘。

### 离线单文件版

```bash
npm run build:offline
# 生成 dist/offline.html —— 直接双击打开或拖到任意静态托管即可，无需网络
```

---

## 🌐 部署

### GitHub Pages（推荐，零成本）

1. 推送到 GitHub 仓库。
2. 仓库 **Settings → Pages → Build and deployment → Source: Deploy from a branch → 选 `main` / `root`**。
3. 访问 `https://<user>.github.io/<repo>/`。

> 本项目是纯静态站点，无需构建步骤，根目录 `index.html` 即入口。

### 其他静态托管

CloudStudio / EdgeOne Pages / Vercel / Netlify 等：直接以仓库根目录作为站点根，入口 `index.html`。

---

## 🔌 接入真实后端

当前 `assets/js/store.js` 中的 `startSimulator(store)` 为**前端模拟器**。对接真实数据时，只需把该函数内部替换为从 REST / WebSocket 拉取并 `store.emit(...)` 即可，所有视图订阅无需改动：

```js
// 伪代码：用 WebSocket 替换模拟器
function startSimulator(store) {
  const ws = new WebSocket('wss://your-api/ranges');
  ws.onmessage = (e) => {
    const data = JSON.parse(e.data);
    store.state.kpis = data.kpis;
    store.state.nodes = data.nodes;
    store.emit('kpi', store.state.kpis);
    store.emit('event', data.lastEvent); // 驱动攻击态势图弧线
    // ...
  };
}
```

事件契约（建议）：`kpi` / `event`（攻击事件，含 `srcId,dstId,side`）/ `teams` / `leaderboard` / `ranges` / `drills` / `clock`。

---

## 📁 目录结构

```
.
├─ index.html
├─ serve.mjs            # 零依赖开发服务器
├─ build-offline.mjs    # 离线单文件构建
├─ package.json
├─ README.md
├─ LICENSE
└─ assets/
   ├─ css/{tokens,app}.css
   └─ js/{store,components,landing,console,router,main}.js
```

---

## 📜 许可证

[MIT](./LICENSE) © 2026 玄盾 XUANDUN
