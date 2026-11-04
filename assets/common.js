// ใช้ร่วมกันทุกหน้า: โหลดข้อมูล, แปลง Markdown, ไอคอน, ปุ่มคัดลอกโค้ด
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const thDate = d => { if (!d) return ''; const t = new Date(d + 'T00:00:00'); return isNaN(t) ? d : t.toLocaleDateString('th-TH', {year:'numeric', month:'long', day:'numeric'}); };

const ICONS = {
  network:'<rect x="9" y="2" width="6" height="5"/><rect x="2" y="17" width="6" height="5"/><rect x="16" y="17" width="6" height="5"/><path d="M12 7v5M5 17v-5h14v5"/>',
  server:'<rect x="3" y="3" width="18" height="7" rx="1"/><rect x="3" y="14" width="18" height="7" rx="1"/><path d="M7 6.5h.01M7 17.5h.01"/>',
  database:'<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  shield:'<path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5z"/><path d="m9 12 2 2 4-4"/>',
  cloud:'<path d="M17.5 19a4.5 4.5 0 0 0 .5-9 6 6 0 0 0-11.6 1.5A4 4 0 0 0 7 19z"/>',
  chip:'<rect x="6" y="6" width="12" height="12"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
  code:'<path d="m8 6-6 6 6 6M16 6l6 6-6 6"/>',
  terminal:'<path d="m4 17 6-5-6-5M12 19h8"/>',
  book:'<path d="M4 4h10a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4z"/><path d="M4 16a4 4 0 0 1 4-4h10"/>',
  tool:'<path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L3 17.8 6.2 21l6.3-6.3a4 4 0 0 0 5.2-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>'
};
const ICON_NAMES = {network:'เครือข่าย', server:'เซิร์ฟเวอร์', database:'ฐานข้อมูล', shield:'ความปลอดภัย', cloud:'คลาวด์', chip:'ฮาร์ดแวร์', code:'โค้ด', terminal:'เทอร์มินัล', book:'คู่มือ', tool:'เครื่องมือ'};
const icon = k => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[k] || ICONS.book}</svg>`;

async function loadData(){
  const r = await fetch('data.json?v=' + Date.now(), {cache:'no-store'});
  if (!r.ok) throw new Error('โหลด data.json ไม่ได้');
  return r.json();
}
const catOf = (data, id) => (data.categories || []).find(c => c.id === id) || {id, name: id || 'ไม่มีหมวด', icon: 'book'};
const sortPosts = posts => [...(posts || [])].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
const plainText = md => String(md || '').replace(/```[\s\S]*?```/g, ' ').replace(/[#>*_`|\-\[\]()!]/g, ' ');

// Markdown → HTML ที่ผ่านการกรองความปลอดภัยแล้ว
function renderMarkdown(md){
  const html = marked.parse(String(md || ''), {gfm: true, breaks: false});
  return DOMPurify.sanitize(html, {ADD_ATTR: ['target']});
}

const isPdf = href => /\.pdf($|[?#])/i.test(href || '');
const isLocalFile = href => !!href && !/^[a-z][a-z0-9+.-]*:/i.test(href) && !href.startsWith('//');
// มือถือ (Android/iPhone) แสดง PDF ในกรอบไม่ได้ จึงให้กดเปิดเต็มจอแทน
const canEmbedPdf = () => !/Android|iPhone|iPod|Mobi/i.test(navigator.userAgent) && matchMedia('(min-width: 768px)').matches;

// ลิงก์ไปไฟล์ PDF ในเว็บที่อยู่บรรทัดเดี่ยว ๆ → กล่อง PDF พร้อมตัวอ่านและปุ่มดาวน์โหลด
function pdfCards(root, fileMap){
  root.querySelectorAll('p > a[href]').forEach(a => {
    const p = a.parentElement, href = a.getAttribute('href');
    if (p.childNodes.length !== 1 || !isPdf(href) || !isLocalFile(href)) return;
    const url = (fileMap && fileMap[href]) || href;
    const name = a.textContent.replace(/^📄\s*/, '').trim() || href.split('/').pop();
    const size = a.getAttribute('title') || '';
    const box = document.createElement('div');
    box.className = 'pdf-card';
    box.innerHTML = `<div class="pdf-head">
        <span class="pdf-ic">PDF</span>
        <span class="pdf-name"><b></b><small></small></span>
        <span class="pdf-acts"><a class="pdf-btn" target="_blank" rel="noopener">เปิดเต็มจอ ↗</a><a class="pdf-btn pri">ดาวน์โหลด</a></span>
      </div>`;
    box.querySelector('b').textContent = name;
    box.querySelector('small').textContent = size ? `ไฟล์ PDF · ${size}` : 'ไฟล์ PDF';
    const [open, dl] = box.querySelectorAll('.pdf-btn');
    open.href = url; dl.href = url; dl.setAttribute('download', name.toLowerCase().endsWith('.pdf') ? name : name + '.pdf');
    if (canEmbedPdf()) {
      const f = document.createElement('iframe');
      f.className = 'pdf-frame'; f.title = name; f.loading = 'lazy'; f.src = url + '#view=FitH';
      box.appendChild(f);
    } else {
      box.insertAdjacentHTML('beforeend', '<p class="pdf-note">บนมือถือ กด "เปิดเต็มจอ" เพื่ออ่านไฟล์</p>');
    }
    p.replaceWith(box);
  });
}

// เพิ่มไฮไลต์สีโค้ด ปุ่มคัดลอก id หัวข้อ กล่อง PDF และให้ลิงก์ภายนอกเปิดแท็บใหม่
// fileMap (เฉพาะหน้า admin): path → objectURL ให้พรีวิวรูป/PDF ที่เพิ่งอัปโหลดได้ทันที
function enhance(root, fileMap){
  pdfCards(root, fileMap);
  if (fileMap) root.querySelectorAll('img[src], a[href]').forEach(el => {
    const attr = el.tagName === 'IMG' ? 'src' : 'href', v = el.getAttribute(attr);
    if (fileMap[v]) el.setAttribute(attr, fileMap[v]);
  });
  root.querySelectorAll('pre > code').forEach(code => {
    if (window.hljs) { try { hljs.highlightElement(code); } catch {} }
    const pre = code.parentElement;
    if (pre.querySelector('.copy')) return;
    const lang = (code.className.match(/language-(\S+)/) || [])[1];
    if (lang) pre.dataset.lang = lang;
    const b = document.createElement('button');
    b.className = 'copy'; b.type = 'button'; b.textContent = 'คัดลอก';
    b.onclick = async () => {
      try { await navigator.clipboard.writeText(code.innerText); b.textContent = 'คัดลอกแล้ว ✓'; }
      catch { b.textContent = 'คัดลอกไม่ได้'; }
      setTimeout(() => b.textContent = 'คัดลอก', 1600);
    };
    pre.appendChild(b);
  });
  const used = {};
  root.querySelectorAll('h2, h3').forEach(h => {
    let id = 'h-' + (h.textContent.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'section');
    used[id] = (used[id] || 0) + 1; if (used[id] > 1) id += '-' + used[id];
    h.id = id;
  });
  root.querySelectorAll('a[href^="http"], a[href$=".pdf"]').forEach(a => { if (!a.hasAttribute('download')) { a.target = '_blank'; a.rel = 'noopener'; } });
  root.querySelectorAll('table').forEach(t => { if (!t.parentElement.classList.contains('tbl')) { const w = document.createElement('div'); w.className = 'tbl'; t.before(w); w.appendChild(t); } });
  root.querySelectorAll('img').forEach(img => { img.loading = 'lazy'; });
}

// ใส่รูปเป็นพื้นหลังพร้อมชั้นสีเข้มให้อ่านตัวหนังสือออก
function setCoverBg(el, url){
  if (!url) { el.classList.remove('has-cover'); el.style.backgroundImage = ''; return; }
  el.classList.add('has-cover');
  el.style.backgroundImage = `linear-gradient(180deg, rgba(9,9,11,.25) 0%, rgba(9,9,11,.55) 50%, rgba(9,9,11,.88) 100%), linear-gradient(90deg, rgba(9,9,11,.55) 0%, rgba(9,9,11,0) 70%), url("${String(url).replace(/["\\\n]/g, encodeURIComponent)}")`;
}

function fillSite(data){
  const s = data.site || {};
  document.querySelectorAll('[data-site]').forEach(el => el.textContent = s[el.dataset.site] ?? '');
  const yr = document.getElementById('yr'); if (yr) yr.textContent = new Date().getFullYear();
}
function showLoadError(){
  document.body.insertAdjacentHTML('afterbegin', '<p style="padding:16px 20px;background:#fdecea;color:#8a1c12;font-family:sans-serif">โหลด data.json ไม่ได้ ต้องเปิดผ่านเว็บเซิร์ฟเวอร์ (เช่น GitHub Pages) ไม่ใช่ดับเบิลคลิกไฟล์</p>');
}

// ปุ่มสลับโหมดสว่าง/มืด (จำค่าไว้ในเบราว์เซอร์นี้)
(function(){
  const root = document.documentElement;
  const current = () => root.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const paint = () => { const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = current() === 'dark' ? '#09090b' : '#fafafa'; };
  document.addEventListener('click', e => {
    if (!e.target.closest('#themeBtn')) return;
    root.dataset.theme = current() === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('theme', root.dataset.theme); } catch {}
    paint();
  });
  paint();
})();
