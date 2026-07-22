// ============================================================
// 玄盾 XUANDUN · 应用入口
// ============================================================
import { renderLanding } from './landing.js';
import { mountConsole, teardownConsole } from './console.js';
import { store, startSimulator } from './store.js';
import { resolve } from './router.js';

const app = document.getElementById('app');
let currentApp = null;
let consoleApi = null;

function render() {
  const r = resolve(location.hash);
  if (r.app === 'landing') {
    if (currentApp !== 'landing') {
      teardownConsole();
      app.className = '';
      app.innerHTML = '';
      renderLanding(app);
      currentApp = 'landing';
      consoleApi = null;
    }
  } else {
    if (currentApp !== 'console') {
      teardownConsole();
      app.className = 'console-mode';
      app.innerHTML = '';
      consoleApi = mountConsole(app);
      currentApp = 'console';
    }
    consoleApi.show(r.route);
  }
}

try {
  window.addEventListener('hashchange', () => { try { render(); } catch (e) { console.error('[玄盾] 路由渲染失败:', e); const t = document.getElementById('bootTip'); if (t) t.textContent = '页面切换失败：' + (e && e.message ? e.message : e); } });
  startSimulator(store);
  render();
  clearTimeout(window.__bootTimer);
} catch (e) {
  const t = document.getElementById('bootTip');
  if (t) t.textContent = '初始化失败: ' + (e && e.message ? e.message : e);
  console.error(e);
}
