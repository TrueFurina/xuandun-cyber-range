// ============================================================
// 玄盾 XUANDUN · 哈希路由
// #/            -> 落地页
// #/console     -> 控制台总览
// #/overview|ranges|drills|red|blue|rank -> 控制台子视图
// ============================================================
const ROUTES = ['overview', 'ranges', 'drills', 'red', 'blue', 'rank'];

export function resolve(hash) {
  const h = (hash || '').replace(/^#\/?/, '');
  if (!h || h === 'landing') return { app: 'landing' };
  if (h === 'console' || ROUTES.includes(h)) return { app: 'console', route: h === 'console' ? 'overview' : h };
  return { app: 'landing' };
}
