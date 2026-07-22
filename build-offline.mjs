// 玄盾 XUANDUN · 离线单文件构建
// 将 CSS/JS 全部内联进 dist/offline.html，零外部依赖，可直接双击打开或任意静态托管。
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const read = (p) => readFile(new URL(p, import.meta.url), 'utf8');

function stripModule(code) {
  return code
    .split('\n')
    .filter((l) => !/^\s*import\s.+/.test(l))      // 去掉 import
    .filter((l) => !/^\s*export\s*\{/.test(l))     // 去掉 export { ... }
    .map((l) => l.replace(/^\s*export\s+/, ''))     // export 关键字去除，保留定义
    .join('\n');
}

const tokens = await read('assets/css/tokens.css');
const app = await read('assets/css/app.css');
const MODULES = ['store.js', 'router.js', 'components.js', 'landing.js', 'console.js', 'main.js'];
const js = (await Promise.all(MODULES.map((m) => read('assets/js/' + m))))
  .map(stripModule)
  .join('\n\n');

let html = await read('index.html');
html = html.replace('<link rel="stylesheet" href="assets/css/tokens.css" />', `<style>\n${tokens}\n${app}\n</style>`);
html = html.replace('<link rel="stylesheet" href="assets/css/app.css" />', '');
html = html.replace(/<!-- 字体[^\n]*\n/, '');
html = html.replace(/<link rel="stylesheet" media="print"[^>]*>\s*/g, '');
html = html.replace(/<noscript>[\s\S]*?<\/noscript>\s*/g, '');
html = html.replace(
  /<script type="module" src="assets\/js\/main.js"[^>]*><\/script>/,
  `<script type="module">\n${js}\n</script>`
);

await mkdir(new URL('dist/', import.meta.url), { recursive: true });
await writeFile(new URL('dist/offline.html', import.meta.url), html, 'utf8');
console.log(`已生成 dist/offline.html（${html.length} bytes，零外部依赖）`);
