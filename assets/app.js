// หน้าเว็บสาธารณะ: โหลดเนื้อหาทั้งหมดจาก data.json
const ICONS = {
  wrench:'<path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L3 17.8 6.2 21l6.3-6.3a4 4 0 0 0 5.2-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>',
  brake:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 3a9 9 0 0 1 9 9"/>',
  engine:'<path d="M4 10h3l2-3h6v3h3l2 2v5h-2v2h-4l-2-2H9l-2-2H4z"/>',
  snow:'<path d="M12 2v20M4 6l16 12M20 6 4 18"/>',
  battery:'<rect x="3" y="7" width="16" height="11" rx="1"/><path d="M21 11v3M8 10v5M5.5 12.5h5M13.5 12.5h3"/>',
  tire:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v5M12 16v5M3 12h5M16 12h5"/>',
  car:'<path d="M3 13l2-5h14l2 5v5h-2v-2H5v2H3z"/><circle cx="7" cy="14" r="1"/><circle cx="17" cy="14" r="1"/>'
};
const svgIcon = k => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[k]||ICONS.car}</svg>`;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const get = (o, p) => p.split('.').reduce((a, k) => a?.[k], o);
const thDate = d => { try { return new Date(d).toLocaleDateString('th-TH',{year:'numeric',month:'long',day:'numeric'}); } catch { return d; } };

async function init(){
  let data;
  try {
    const r = await fetch('data.json?v=' + Date.now());
    data = await r.json();
  } catch (e) {
    document.body.insertAdjacentHTML('afterbegin','<p style="padding:20px;background:#fee">โหลด data.json ไม่ได้ ให้เปิดผ่านเว็บเซิร์ฟเวอร์ (เช่น GitHub Pages) ไม่ใช่ดับเบิลคลิกไฟล์</p>');
    return;
  }
  const s = data.site || {};
  document.title = `${s.name} | ${s.tagline}`;
  document.querySelectorAll('[data-bind]').forEach(el => el.textContent = get(data, el.dataset.bind) ?? '');
  document.getElementById('yr').textContent = new Date().getFullYear();
  document.getElementById('callBtn').href = 'tel:' + (s.phone||'').replace(/[^\d+]/g,'');
  document.getElementById('mapLink').href = s.mapUrl || '#';

  document.getElementById('stats').innerHTML = (s.stats||[]).map(x =>
    `<div class="stat"><b>${esc(x.value)}</b><small>${esc(x.label)}</small></div>`).join('');

  const services = data.services || [];
  document.getElementById('serviceList').innerHTML = services.map(x => `
    <article class="card">
      <div class="ic">${svgIcon(x.icon)}</div>
      <h3>${esc(x.title)}</h3><p>${esc(x.desc)}</p>
      ${x.price ? `<div class="price">${esc(x.price)}</div>` : ''}
    </article>`).join('');
  document.getElementById('serviceSelect').innerHTML += services.map(x => `<option>${esc(x.title)}</option>`).join('');

  const posts = [...(data.posts||[])].sort((a,b) => (b.date||'').localeCompare(a.date||''));
  document.getElementById('postList').innerHTML = posts.map(p => `
    <article class="post">
      <div class="thumb"></div>
      <div class="in">
        <time>${esc(thDate(p.date))}</time>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.excerpt)}</p>
        <div class="full">${esc(p.body).replace(/\n/g,'<br>')}</div>
        <button type="button" onclick="this.closest('.post').classList.toggle('open');this.textContent=this.closest('.post').classList.contains('open')?'ย่อ ▲':'อ่านต่อ ▼'">อ่านต่อ ▼</button>
      </div>
    </article>`).join('') || '<p>ยังไม่มีบทความ</p>';

  // ฟอร์มนัดหมาย: GitHub Pages ไม่มี backend จึงส่งผ่านโปรแกรมอีเมลของผู้ใช้
  document.getElementById('bookForm').addEventListener('submit', e => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    const body = `ชื่อ: ${f.name}\nโทร: ${f.tel}\nรถ: ${f.car}\nวันที่ต้องการ: ${f.date}\nบริการ: ${f.service}\nรายละเอียด: ${f.note}`;
    location.href = `mailto:${s.email}?subject=${encodeURIComponent('นัดหมายซ่อม - ' + f.name)}&body=${encodeURIComponent(body)}`;
  });
}
init();
