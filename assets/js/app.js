(function () {
  'use strict';

  var CATS = window.CATS;
  var POSTS = window.POSTS.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });
  var app = document.getElementById('app');
  var state = { cat: 'all', animated: false };

  /* ---------- เส้นชั้นความสูง (สร้างจาก seed ของแต่ละโพสต์) ---------- */
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  function contours(seed, o) {
    var r = mulberry(hash(seed)), out = '';
    var p1 = r() * 6.28, p2 = r() * 6.28, p3 = r() * 6.28;
    var k1 = 0.10 + r() * 0.08, k2 = 0.05 + r() * 0.05, k3 = 0.02 + r() * 0.03;
    for (var i = 1; i <= o.n; i++) {
      var base = o.rmin + (o.rmax - o.rmin) * i / o.n, d = '';
      for (var s = 0; s <= 90; s++) {
        var a = s / 90 * Math.PI * 2;
        var rad = base * (1 + k1 * Math.sin(2 * a + p1 + i * 0.09) + k2 * Math.sin(3 * a + p2 - i * 0.07) + k3 * Math.sin(5 * a + p3 + i * 0.05));
        d += (s ? 'L' : 'M') + (o.cx + Math.cos(a) * rad * (o.sx || 1)).toFixed(1) + ' ' + (o.cy + Math.sin(a) * rad).toFixed(1);
      }
      out += '<path d="' + d + 'Z" pathLength="1" class="' + (i % o.every === 0 ? 'c-idx' : 'c') + '" style="--i:' + i + '"/>';
    }
    return out;
  }

  function thumb(p) {
    var c = CATS[p.cat] || { color: 'var(--muted)' };
    return '<div class="thumb" style="--c:' + c.color + '"><svg viewBox="0 0 100 100" aria-hidden="true">' +
      contours(p.slug, { n: 9, rmin: 4, rmax: 64, cx: 50, cy: 50, every: 3 }) + '</svg></div>';
  }

  function fmt(d) {
    return new Date(d + 'T00:00:00').toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function catHtml(p) {
    var c = CATS[p.cat] || { label: p.cat, color: 'var(--muted)' };
    return '<span class="cat"><i class="dot" style="--c:' + c.color + '"></i>' + c.label + '</span>';
  }

  /* ---------- หน้าแรก ---------- */
  function home() {
    document.title = 'Auranth — บล็อกส่วนตัว';
    document.body.classList.remove('is-post');
    var cls = 'contours' + (state.animated ? '' : ' animate');
    state.animated = true;

    app.innerHTML =
      '<section class="hero">' +
        '<svg class="' + cls + '" viewBox="0 0 1000 800" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">' +
          contours('auranth-hero', { n: 28, rmin: 30, rmax: 660, cx: 720, cy: 360, sx: 1.15, every: 5 }) +
        '</svg>' +
        '<div class="hero-inner">' +
          '<h1 class="wordmark">Auranth</h1>' +
          '<p class="hero-sub">เรื่องเล่า ความคิด และการเดินทาง<br>เขียนช้าๆ อ่านสบายๆ</p>' +
        '</div>' +
      '</section>' +
      '<section class="section" aria-label="โพสต์ทั้งหมด">' +
        '<div class="filters" id="filters"></div>' +
        '<div id="list"></div>' +
      '</section>';

    renderFilters();
    renderList();
  }

  function renderFilters() {
    var items = [['all', 'ทั้งหมด', 'var(--muted)']].concat(Object.keys(CATS).map(function (k) { return [k, CATS[k].label, CATS[k].color]; }));
    var box = document.getElementById('filters');
    box.innerHTML = items.map(function (it) {
      return '<button class="chip" type="button" data-cat="' + it[0] + '" aria-pressed="' + (state.cat === it[0]) + '">' +
        '<i class="dot" style="--c:' + it[2] + '"></i>' + it[1] + '</button>';
    }).join('');
    box.onclick = function (e) {
      var b = e.target.closest('.chip'); if (!b) return;
      state.cat = b.getAttribute('data-cat');
      renderFilters(); renderList();
    };
  }

  function renderList() {
    var list = POSTS.filter(function (p) { return state.cat === 'all' || p.cat === state.cat; });
    var box = document.getElementById('list');
    if (!list.length) {
      box.innerHTML = '<div class="empty"><p>ยังไม่มีโพสต์ในหมวดนี้</p><button class="btn" type="button" id="showAll">ดูโพสต์ทั้งหมด</button></div>';
      document.getElementById('showAll').onclick = function () { state.cat = 'all'; renderFilters(); renderList(); };
      return;
    }
    box.innerHTML = list.map(function (p) {
      var c = (CATS[p.cat] || {}).color || 'var(--muted)';
      return '<a class="post" href="#/posts/' + p.slug + '" style="--c:' + c + '">' + thumb(p) +
        '<div><div class="meta">' + catHtml(p) + '<span>' + fmt(p.date) + '</span><span>อ่าน ' + p.read + '</span></div>' +
        '<h2 class="post-title">' + p.title + '</h2>' +
        '<p class="post-excerpt">' + p.excerpt + '</p></div></a>';
    }).join('');
  }

  /* ---------- หน้าอ่านโพสต์ ---------- */
  function post(slug) {
    var i = POSTS.findIndex(function (p) { return p.slug === slug; });
    if (i < 0) return notFound();
    var p = POSTS[i], newer = POSTS[i - 1], older = POSTS[i + 1];
    document.title = p.title + ' — Auranth';
    document.body.classList.add('is-post');

    var pager = '';
    if (newer || older) {
      pager = '<nav class="pager" aria-label="โพสต์อื่น">' +
        (older ? '<a class="prev" href="#/posts/' + older.slug + '"><small>โพสต์ก่อนหน้า</small><span>' + older.title + '</span></a>' : '<span></span>') +
        (newer ? '<a class="next" href="#/posts/' + newer.slug + '"><small>โพสต์ถัดไป</small><span>' + newer.title + '</span></a>' : '') +
        '</nav>';
    }

    app.innerHTML =
      '<div class="article-wrap"><a class="back" href="#/">← กลับหน้าแรก</a>' +
      '<article><div class="meta">' + catHtml(p) + '<span>' + fmt(p.date) + '</span><span>อ่าน ' + p.read + '</span></div>' +
      '<h1 class="article-title">' + p.title + '</h1>' +
      '<div class="article-body">' + p.body + '</div></article>' + pager + '</div>';
  }

  function notFound() {
    document.title = 'ไม่พบหน้านี้ — Auranth';
    document.body.classList.remove('is-post');
    app.innerHTML = '<div class="article-wrap"><h1 class="article-title">ไม่พบหน้านี้</h1><p>ลิงก์อาจพิมพ์ผิด หรือโพสต์ถูกย้ายไปแล้ว</p><a class="btn" href="#/">กลับหน้าแรก</a></div>';
  }

  /* ---------- router ---------- */
  function route() {
    var h = location.hash.replace(/^#\/?/, '');
    var m = h.match(/^posts\/(.+)$/);
    if (m) post(decodeURIComponent(m[1])); else home();
    window.scrollTo(0, 0);
    updateProgress();
  }

  function updateProgress() {
    var el = document.getElementById('progress');
    var max = document.documentElement.scrollHeight - window.innerHeight;
    el.style.width = (max > 0 ? Math.min(100, window.scrollY / max * 100) : 0) + '%';
  }
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress);
  window.addEventListener('hashchange', route);

  /* ---------- ธีม สว่าง/มืด ---------- */
  document.getElementById('themeBtn').addEventListener('click', function () {
    var root = document.documentElement;
    var cur = root.getAttribute('data-theme');
    var dark = cur ? cur === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    var next = dark ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('auranth-theme', next); } catch (e) {}
  });

  document.getElementById('year').textContent = new Date().getFullYear() + 543;
  route();
})();
