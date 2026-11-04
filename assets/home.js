// หน้าแรก: ค้นหา + กรองตามหมวด/แท็ก (สถานะเก็บใน URL จึงแชร์ลิงก์ผลค้นหาได้)
let DATA, POSTS = [];
const $ = id => document.getElementById(id);
const state = () => { const p = new URLSearchParams(location.search); return {cat: p.get('cat') || '', tag: p.get('tag') || '', q: p.get('q') || ''}; };
function setState(patch){
  const s = {...state(), ...patch}, p = new URLSearchParams();
  Object.entries(s).forEach(([k, v]) => v && p.set(k, v));
  history.replaceState(null, '', p.toString() ? '?' + p : location.pathname);
  render();
}
const hl = (text, q) => {
  const t = esc(text); if (!q) return t;
  const words = q.trim().split(/\s+/).filter(Boolean).map(w => esc(w).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return words.length ? t.replace(new RegExp(`(${words.join('|')})`, 'gi'), '<mark>$1</mark>') : t;
};

function render(){
  const {cat, tag, q} = state();
  if ($('q').value !== q) $('q').value = q;
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const list = POSTS.filter(p =>
    (!cat || p.category === cat) &&
    (!tag || (p.tags || []).includes(tag)) &&
    words.every(w => p._search.includes(w)));

  // หมวดหมู่
  const count = id => POSTS.filter(p => !id || p.category === id).length;
  $('cats').innerHTML = [{id:'', name:'ทั้งหมด', icon:'book'}, ...(DATA.categories || [])].map(c =>
    `<button class="${c.id === cat ? 'on' : ''}" data-cat="${esc(c.id)}">${icon(c.icon)}<span>${esc(c.name)}</span><span class="n">${count(c.id)}</span></button>`).join('');

  // แท็ก (เรียงตามความถี่)
  const freq = {}; POSTS.forEach(p => (p.tags || []).forEach(t => freq[t] = (freq[t] || 0) + 1));
  $('tags').innerHTML = Object.keys(freq).sort((a, b) => freq[b] - freq[a] || a.localeCompare(b))
    .map(t => `<button class="chip ${t === tag ? 'on' : ''}" data-tag="${esc(t)}">#${esc(t)}</button>`).join('') || '<span class="chip">ยังไม่มีแท็ก</span>';

  const parts = [];
  if (cat) parts.push(catOf(DATA, cat).name);
  if (tag) parts.push('#' + tag);
  if (q) parts.push(`“${q}”`);
  $('resultTitle').textContent = parts.length ? `${parts.join(' · ')} (${list.length})` : `บทความล่าสุด (${list.length})`;
  $('clearBtn').hidden = !parts.length;

  $('cards').innerHTML = list.map(p => {
    const c = catOf(DATA, p.category);
    return `<a class="pcard" href="post.html?p=${encodeURIComponent(p.slug)}">
      <div class="thumb ${p.cover ? '' : 'gen'}">${p.cover ? `<img src="${esc(p.cover)}" alt="" loading="lazy">` : icon(c.icon)}</div>
      <div class="in">
        <div class="meta"><span class="cat">${esc(c.name)}</span><span>${esc(thDate(p.date))}</span>${/\]\([^)\s]+\.pdf[\s)"]/i.test(p.body || '') ? '<span class="pdf-tag">PDF</span>' : ''}</div>
        <h3>${hl(p.title, q)}</h3>
        <p>${hl(p.excerpt, q)}</p>
        <div class="tags">${(p.tags || []).map(t => `<span>#${hl(t, q)}</span>`).join(' ')}</div>
      </div></a>`;
  }).join('') || `<div class="empty" style="grid-column:1/-1">ไม่พบบทความที่ตรงกับเงื่อนไข</div>`;
}

(async () => {
  try { DATA = await loadData(); } catch { return showLoadError(); }
  fillSite(DATA);
  setCoverBg(document.querySelector('.hero'), DATA.site.heroImage);
  document.title = `${DATA.site.name} | ${DATA.site.tagline}`;
  POSTS = sortPosts(DATA.posts).filter(p => !p.draft).map(p => ({...p,
    _search: [p.title, p.excerpt, (p.tags || []).join(' '), catOf(DATA, p.category).name, plainText(p.body)].join(' ').toLowerCase()}));
  render();

  $('cats').onclick = e => { const b = e.target.closest('[data-cat]'); if (b) setState({cat: b.dataset.cat}); };
  $('tags').onclick = e => { const b = e.target.closest('[data-tag]'); if (b) setState({tag: b.dataset.tag === state().tag ? '' : b.dataset.tag}); };
  $('clearBtn').onclick = () => setState({cat:'', tag:'', q:''});
  let t; $('q').oninput = e => { clearTimeout(t); t = setTimeout(() => setState({q: e.target.value.trim()}), 150); };
  document.addEventListener('keydown', e => { if (e.key === '/' && document.activeElement.tagName !== 'INPUT') { e.preventDefault(); $('q').focus(); } });
})();
