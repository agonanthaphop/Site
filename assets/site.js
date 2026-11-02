(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const root = document.body.dataset.root || '';
  const html = document.documentElement;

  /* ธีมสว่าง/มืด */
  const dark = () => (html.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')) === 'dark';
  const tt = $('#tt');
  if (tt) {
    const paint = () => { tt.textContent = dark() ? 'โหมดสว่าง' : 'โหมดมืด'; tt.setAttribute('aria-pressed', dark()); };
    paint();
    tt.addEventListener('click', () => { const n = dark() ? 'light' : 'dark'; html.dataset.theme = n; try { localStorage.setItem('theme', n); } catch (e) {} paint(); });
  }

  /* แถบความคืบหน้าการอ่าน */
  const bar = $('#bar');
  if (bar) {
    const f = () => { const m = html.scrollHeight - html.clientHeight; bar.style.transform = `scaleX(${m > 0 ? Math.min(1, html.scrollTop / m) : 0})`; };
    addEventListener('scroll', f, { passive: true }); addEventListener('resize', f); f();
  }

  /* คัดลอกลิงก์ */
  const cp = $('#cp');
  if (cp) cp.addEventListener('click', async () => {
    const u = location.href.split('#')[0];
    try { await navigator.clipboard.writeText(u); cp.textContent = 'คัดลอกแล้ว ✓'; setTimeout(() => cp.textContent = 'คัดลอกลิงก์', 2000); }
    catch (e) { prompt('คัดลอกลิงก์นี้', u); }
  });

  /* ดัชนีบทความ (search.json) */
  let loaded;
  const data = () => loaded || (loaded = fetch(root + 'search.json').then(r => r.ok ? r.json() : []).catch(() => []));

  /* หน้าแรก: ค้นหา + กรองหมวด/แท็ก */
  const items = $$('[data-slug]'), chipsBox = $('#chips'), q = $('#q');
  if (chipsBox && items.length) {
    const P = new URLSearchParams(location.search);
    const S = { cat: P.get('cat') || '', tag: P.get('tag') || '', q: P.get('q') || '' };
    const cats = [...new Set(items.map(a => a.dataset.cat).filter(Boolean))];
    if (q) q.value = S.q;
    let seq = 0;
    const draw = () => {
      chipsBox.textContent = '';
      const mk = (label, on, fn) => { const b = el('button', 'chip', label); b.type = 'button'; b.setAttribute('aria-pressed', on); b.addEventListener('click', fn); chipsBox.append(b); };
      if (cats.length > 1 || S.cat) mk('ทั้งหมด', !S.cat && !S.tag, () => { S.cat = S.tag = ''; apply(); });
      if (cats.length > 1) cats.forEach(c => mk(c, S.cat === c, () => { S.cat = S.cat === c ? '' : c; apply(); }));
      if (S.tag) mk('#' + S.tag + ' ✕', true, () => { S.tag = ''; apply(); });
    };
    const apply = async () => {
      const my = ++seq, term = S.q.trim().toLowerCase();
      let hits = null, dom = false;
      if (term) {
        const d = await data(); if (my !== seq) return;
        if (d.length) hits = new Set(d.filter(p => [p.title, p.excerpt, p.category, (p.tags || []).join(' '), p.text].join(' ').toLowerCase().includes(term)).map(p => p.slug));
        else dom = true; // ยังไม่มี search.json: ค้นจากข้อความบนหน้า
      }
      let n = 0;
      items.forEach(a => {
        const tags = (a.dataset.tags || '').split('|');
        const byText = hits ? hits.has(a.dataset.slug) : dom ? a.textContent.toLowerCase().includes(term) : true;
        const ok = (!S.cat || a.dataset.cat === S.cat) && (!S.tag || tags.includes(S.tag)) && byText;
        a.hidden = !ok; if (ok) n++;
      });
      $$('.grid').forEach(g => g.hidden = !$$('[data-slug]', g).some(x => !x.hidden));
      const none = $('#none'); if (none) none.hidden = n > 0;
      const sp = new URLSearchParams(); if (S.cat) sp.set('cat', S.cat); if (S.tag) sp.set('tag', S.tag); if (S.q) sp.set('q', S.q);
      history.replaceState(null, '', (sp.toString() ? '?' + sp : location.pathname) + location.hash);
      draw();
    };
    if (q) q.addEventListener('input', () => { S.q = q.value; apply(); });
    apply();
    if (location.hash === '#search' && q) q.focus();
  }

  /* หน้าบทความ: ก่อนหน้า/ถัดไป + บทความที่เกี่ยวข้อง */
  const slug = document.body.dataset.post, more = $('#more');
  if (slug && more) data().then(list => {
    const i = list.findIndex(p => p.slug === slug); if (i < 0) return;
    const me = list[i], link = (p, c) => { const a = el('a', c); a.href = root + 'posts/' + p.slug + '/'; return a; };
    const pn = el('div', 'pn');
    const older = list[i + 1], newer = list[i - 1];
    [[older, 'pnl', '← ก่อนหน้า'], [newer, 'pnl nx', 'ถัดไป →']].forEach(([p, c, lab]) => { if (!p) return; const a = link(p, c); a.append(el('small', '', lab), el('span', 'd', p.title)); pn.append(a); });
    if (pn.children.length) more.append(pn);
    const score = p => (p.tags || []).filter(t => (me.tags || []).includes(t)).length * 2 + (p.category === me.category ? 1 : 0);
    const rel = list.filter(p => p.slug !== slug && score(p) > 0).sort((a, b) => score(b) - score(a)).slice(0, 3);
    if (rel.length) {
      const box = el('section', 'rel'); box.append(el('h2', 'd', 'อ่านต่อ'));
      rel.forEach(p => { const a = link(p, ''); a.append(document.createTextNode(p.title), el('small', '', p.minutes + ' นาที')); box.append(a); });
      more.append(box);
    }
  });
})();
