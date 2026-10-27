/* ===== เพิ่มโพสต์ใหม่ที่ไฟล์นี้ =====
   1) คัดลอกบล็อก { ... }, ของโพสต์ใดโพสต์หนึ่งไปวางต่อท้าย
   2) แก้ slug (ใช้ภาษาอังกฤษ ไม่มีเว้นวรรค), cat, date (ปี ค.ศ. รูปแบบ YYYY-MM-DD), title, excerpt, body
   3) cat ใช้ได้: "IT", "Running", "Travel"
   body เขียนเป็น HTML: <p>, <h3>, <ul>, <pre><code>, <blockquote> */

window.CATS = {
  IT:      { label: "IT",    color: "var(--accent)" },
  Running: { label: "Running", color: "var(--sun)" },
  Travel:  { label: "เที่ยว",  color: "var(--moss)" }
};

window.POSTS = [
  {
    slug: "windows-server-tips",
    cat: "IT",
    date: "2026-06-27",
    read: "3 นาที",
    title: "Windows Server Tips ที่ใช้บ่อยในงาน IT",
    excerpt: "รวม Tips การใช้งาน Windows Server ที่ช่วยประหยัดเวลาในงานประจำวัน",
    body: `
      <p>งาน IT ประจำวันมีเรื่องซ้ำๆ เยอะ ถ้ารู้ทางลัดไม่กี่อย่างก็ช่วยประหยัดเวลาได้มาก นี่คือที่ใช้บ่อยที่สุด</p>

      <h3>1. เปิดเครื่องมือด้วย Run</h3>
      <p>กด <code>Win + R</code> แล้วพิมพ์ <code>services.msc</code>, <code>eventvwr</code>, <code>diskmgmt.msc</code> หรือ <code>taskschd.msc</code> เข้าถึงได้ทันที ไม่ต้องไล่หาในเมนู</p>

      <h3>2. เช็กบริการด้วย PowerShell</h3>
      <p>ดูว่ามีบริการไหนหยุดทำงานอยู่ แล้วรีสตาร์ตได้ในคำสั่งเดียว</p>
      <pre><code>Get-Service | Where-Object Status -eq 'Stopped'
Restart-Service -Name Spooler</code></pre>

      <h3>3. อ่าน Event Viewer แบบมีหลักการ</h3>
      <p>เริ่มจากกรอง Level เป็น Error และ Critical ก่อน แล้วดูช่วงเวลาที่ปัญหาเกิดขึ้น มักเจอต้นเหตุได้เร็วกว่าไล่อ่านทั้งหมด</p>

      <h3>4. ตั้ง Task Scheduler ให้ทำงานแทนเรา</h3>
      <p>งานสำรองข้อมูลหรือสคริปต์ตรวจสอบรายวัน ตั้งเวลาไว้แล้วลืมได้เลย แต่ให้ส่งผลลัพธ์เข้า log ไว้ตรวจย้อนหลังด้วย</p>

      <h3>5. เปิด RDP อย่างปลอดภัย</h3>
      <blockquote>อย่าเปิดพอร์ต RDP ออกอินเทอร์เน็ตตรงๆ</blockquote>
      <p>ควรเข้าผ่าน VPN และเปิดใช้ Network Level Authentication เสมอ</p>
    `
  },
  {
    slug: "hello-world",
    cat: "IT",
    date: "2026-06-26",
    read: "1 นาที",
    title: "Hello World",
    excerpt: "blog แรกของ Auranth — จะเขียนเรื่อง IT, Running และการเที่ยว",
    body: `
      <p>สวัสดีครับ นี่คือโพสต์แรกของบล็อก Auranth</p>
      <p>ที่นี่จะเป็นพื้นที่เล่าเรื่องสามอย่างที่ชอบ คือ <strong>IT</strong> จากงานประจำ <strong>การวิ่ง</strong> ที่ช่วยให้หัวโล่ง และ <strong>การเดินทาง</strong> ที่พาไปเจออะไรใหม่ๆ</p>
      <p>เขียนช้าๆ อ่านสบายๆ ขอบคุณที่แวะมาครับ</p>
    `
  }
];
