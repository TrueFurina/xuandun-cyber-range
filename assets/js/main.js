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

// —— 全局错误兜底：任何未捕获异常都给用户可读提示，而非静默白屏/无限转圈 ——
function toast(msg) {
  let el = document.getElementById('globalToast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'globalToast';
    el.className = 'global-toast';
    el.setAttribute('role', 'alert');
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), 4200);
}
window.addEventListener('error', (e) => {
  console.error('[玄盾] 未捕获错误:', e.error || e.message);
  toast('发生异常，部分功能可能受影响');
});
window.addEventListener('unhandledrejection', (e) => {
  console.error('[玄盾] 未处理的 Promise 拒绝:', e.reason);
  toast('请求异常，请稍后重试');
});

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

// —— PWA：注册 Service Worker（离线可用 / 可安装）。失败不影响主流程 ——
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch((err) => console.warn('[玄盾] SW 注册失败:', err));
  });
}
