// ============================================================
// 玄盾 XUANDUN · 落地页视图
// ============================================================

const TERM_SCRIPT = [
  ['t', '[14:32:01] ', 'green', 'SYSTEM', ' 靶场内核已就绪 · 12 类漏洞模板加载完成'],
  ['t', '[14:32:02] ', 'cyan',  'BLUE',  ' 防御智能体 BLUE-02 完成基线加固 (harden)'],
  ['t', '[14:32:04] ', 'red',   'RED',   ' 红队 RED-01 发起 SQL 注入 → node-B'],
  ['t', '[14:32:05] ', 'yl',    'WARN',  ' node-B 检测到异常查询，触发隔离策略'],
  ['t', '[14:32:06] ', 'green', 'BLUE',  ' 拦截成功 · 攻击被阻断 (BLOCKED)'],
  ['t', '[14:32:09] ', 'red',   'RED',   ' 红队 RED-03 尝试横向移动 → node-D'],
  ['t', '[14:32:11] ', 'cyan',  'BLUE',  ' 行为检测模型命中 · 置信度 0.94'],
  ['t', '[14:32:12] ', 'green', 'OK',    ' 演练回合 1,204 结束 · 红队胜率 63%'],
];

export function renderLanding(root) {
  root.innerHTML = `
  <div class="landing">
    <header class="lp-nav">
      <div class="container row">
        <div class="brand"><span class="mark">玄</span>玄盾 <small>XUANDUN</small></div>
        <nav class="lp-links">
          <a href="#cap">核心能力</a><a href="#how">工作原理</a><a href="#arch">技术架构</a><a href="#cta">合作</a>
          <a href="#/console" class="green">进入控制台 →</a>
        </nav>
      </div>
    </header>

    <section class="hero container">
      <div class="grid">
        <div>
          <span class="eyebrow">● AI 驱动的红蓝对抗训练平台</span>
          <h1>让 AI 在<span class="hl">对抗</span>中<br/>学会<span class="hl">攻防</span></h1>
          <p class="lead">玄盾是面向红蓝对抗训练的 AI 攻防靶场系统。基于多智能体强化学习（MARL），自动化生成、调度与评估攻防演练，让防御策略在真实对抗压力下持续进化。</p>
          <div class="cta">
            <a href="#/console" class="btn btn-primary">进入控制台</a>
            <a href="#cta" class="btn btn-ghost">预约产品演示</a>
          </div>
          <div class="note">// 已服务 32 家企业安全团队 · 累计对抗推演 12,480 局</div>
        </div>
        <div class="term">
          <div class="term-bar"><i></i><i></i><i></i><span>range@xuandun — live feed</span></div>
          <div class="term-body" id="lpTerm"></div>
        </div>
      </div>
    </section>

    <section class="container">
      <div class="stats">
        <div class="stat panel"><div class="v" data-to="128">0</div><div class="k">在线靶机</div><div class="delta green">▲ 12 较昨日</div></div>
        <div class="stat panel"><div class="v" data-to="14">0</div><div class="k">进行中演练</div><div class="delta green">▲ 3 较昨日</div></div>
        <div class="stat panel"><div class="v" data-to="12480">0</div><div class="k">累计对抗局数</div><div class="delta cyan">持续累积</div></div>
        <div class="stat panel"><div class="v" data-to="63">0</div><div class="k">红队胜率 %</div><div class="delta red">▼ 2.1 波动</div></div>
      </div>
    </section>

    <section class="section container" id="cap">
      <div class="section-head">
        <div class="kicker">CORE CAPABILITIES</div>
        <h2>一套系统，覆盖攻防全生命周期</h2>
        <p>从靶场生成到效能评估，玄盾把安全对抗训练的工程复杂度收敛为统一平台。</p>
      </div>
      <div class="caps">
        <div class="cap panel"><div class="ic" style="background:rgba(45,225,160,.12);color:var(--accent)">◈</div><div class="idx">01</div><h3>智能靶场生成</h3><p>基于漏洞模板与资产画像，秒级编排含 Web / 域控 / OT-ICS / 云原生的异构靶机环境。</p></div>
        <div class="cap panel"><div class="ic" style="background:rgba(56,189,248,.12);color:var(--cyan)">⟳</div><div class="idx">02</div><h3>自动化红蓝编排</h3><p>声明式编排红蓝双方智能体、对抗剧本与评分规则，一键发起可复现的演练。</p></div>
        <div class="cap panel"><div class="ic" style="background:rgba(255,77,109,.12);color:var(--red)">⚔</div><div class="idx">03</div><h3>AI 对抗训练 (MARL)</h3><p>红蓝双方以多智能体强化学习互搏，在课程式对手课程中持续提升策略强度。</p></div>
        <div class="cap panel"><div class="ic" style="background:rgba(245,166,35,.12);color:var(--orange)">◎</div><div class="idx">04</div><h3>攻防效能评估</h3><p>多维度量化红队突破率与蓝队 MTTR，生成可审计的效能报告与改进建议。</p></div>
      </div>
    </section>

    <section class="section container" id="how">
      <div class="section-head">
        <div class="kicker">HOW IT WORKS</div>
        <h2>四步，把对抗变成持续训练</h2>
      </div>
      <div class="steps">
        <div class="step panel"><div class="n">1</div><h4>建模</h4><p>导入资产与威胁画像，自动生成靶场拓扑与脆弱性清单。</p></div>
        <div class="step panel"><div class="n">2</div><h4>编排</h4><p>选择红蓝智能体与剧本，定义评分与终止条件。</p></div>
        <div class="step panel"><div class="n">3</div><h4>推演</h4><p>双方智能体实时对抗，态势与日志全程可视化。</p></div>
        <div class="step panel"><div class="n">4</div><h4>评估</h4><p>复盘对局，更新策略与靶场难度，闭环迭代。</p></div>
      </div>
    </section>

    <section class="section container" id="arch">
      <div class="section-head">
        <div class="kicker">TECH ARCHITECTURE</div>
        <h2>四层架构，工程可落地</h2>
      </div>
      <div class="arch">
        <div class="layer"><div class="lv">L1 · 接入层</div><h4>接入与编排</h4><ul><li>靶场编排 API</li><li>剧本 DSL</li><li>多租户隔离</li></ul></div>
        <div class="layer"><div class="lv">L2 · 仿真层</div><h4>靶场与流量</h4><ul><li>异构靶机池</li><li>流量镜像</li><li>漏洞模板库</li></ul></div>
        <div class="layer"><div class="lv">L3 · 智能层</div><h4>MARL 引擎</h4><ul><li>IQL / VDN / QMIX</li><li>CARS 奖励塑形</li><li>对手课程</li></ul></div>
        <div class="layer"><div class="lv">L4 · 评估层</div><h4>度量与报告</h4><ul><li>突破率度量</li><li>MTTR 分析</li><li>效能看板</li></ul></div>
      </div>
    </section>

    <section class="section container" id="cta">
      <div class="cta-band">
        <h2>把你的安全团队，放进真实对抗里</h2>
        <p>开通试用，30 分钟内拥有可运行的 AI 攻防靶场。</p>
        <div class="cta" style="justify-content:center">
          <a href="#/console" class="btn btn-primary">免费试用控制台</a>
          <a href="#" class="btn btn-ghost">联系销售</a>
        </div>
      </div>
    </section>

    <footer class="footer">
      <div class="container">
        <div class="grid">
          <div><div class="brand" style="margin-bottom:14px"><span class="mark">玄</span>玄盾 <small>XUANDUN</small></div><p class="muted" style="max-width:280px;font-size:13px">面向红蓝对抗训练的 AI 攻防靶场系统，让防御在对抗中进化。</p></div>
          <div><h5>产品</h5><a href="#cap">核心能力</a><a href="#how">工作原理</a><a href="#/console">控制台</a><a href="#cta">定价</a></div>
          <div><h5>资源</h5><a href="#">技术白皮书</a><a href="#">API 文档</a><a href="#">漏洞模板库</a><a href="#">博客</a></div>
          <div><h5>公司</h5><a href="#">关于玄盾</a><a href="#">安全合规</a><a href="#">联系我们</a><a href="#">招贤纳士</a></div>
        </div>
        <div class="copy"><span>© 2026 玄盾 XUANDUN · AI 攻防靶场系统</span><span>沪ICP备 0000000 号</span></div>
      </div>
    </footer>
  </div>`;

  // 终端逐行打印
  const term = root.querySelector('#lpTerm');
  let li = 0;
  function printLine() {
    const [, ts, cls, tag, msg] = TERM_SCRIPT[li % TERM_SCRIPT.length];
    const div = document.createElement('div');
    div.className = 'ln';
    div.innerHTML = `<span class="t">${ts}</span><span class="${cls}">[${tag}]</span> ${msg}`;
    term.appendChild(div);
    while (term.children.length > 8) term.removeChild(term.firstChild);
    li++;
    setTimeout(printLine, 900);
  }
  printLine();

  // 数字滚动
  root.querySelectorAll('.stat .v').forEach((el) => {
    const to = +el.dataset.to; const dur = 1200; const t0 = performance.now();
    function step(t) {
      const p = Math.min(1, (t - t0) / dur);
      const v = Math.floor((1 - Math.pow(1 - p, 3)) * to);
      el.textContent = v.toLocaleString();
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
}
