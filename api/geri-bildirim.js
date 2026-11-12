// SUDOGU oyun içi geri bildirim → e-posta (FormSubmit üzerinden).
// Uygulama localhost/capacitor adresinden çalıştığı için FormSubmit'e doğrudan istek reddediliyor;
// bu fonksiyon isteği yasal sitenin adresiyle iletir.
const MAIL = 'ypremium0952@gmail.com';
const SITE = 'https://sudogulegal.vercel.app';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false });
  try {
    let b = req.body;
    if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
    b = b || {};
    const message = String(b.message || '').trim().slice(0, 3000);
    const game = String(b.game || '').slice(0, 1500);
    if (!message || b.app !== 'sudogu') return res.status(400).json({ success: false });
    // v2: önce Resend (anahtar Vercel ortam değişkeni RESEND_API_KEY'de; kodda yok)
    const KEY = process.env.RESEND_API_KEY;
    if (KEY) {
      const esc = x => x.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
      const rr = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'SUDOGU <onboarding@resend.dev>', to: [MAIL], subject: 'SUDOGU geri bildirim',
          text: message + '\n\n---\n' + game,
          html: '<p style="white-space:pre-wrap;font-size:15px">' + esc(message) + '</p><hr><pre style="white-space:pre-wrap;color:#777;font-size:12px">' + esc(game) + '</pre>'
        })
      });
      const rj = await rr.json().catch(() => ({}));
      if (rr.ok && rj && rj.id) return res.status(200).json({ success: true });
      console.log('resend hata', rr.status, JSON.stringify(rj).slice(0, 300));
    }
    const r = await fetch('https://formsubmit.co/ajax/' + MAIL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Origin': SITE, 'Referer': SITE + '/' },
      body: JSON.stringify({ _subject: 'SUDOGU geri bildirim', _template: 'table', _captcha: 'false', message, game })
    });
    const j = await r.json().catch(() => ({}));
    const ok = j && (j.success === true || j.success === 'true');
    return res.status(ok ? 200 : 502).json({ success: ok, info: ok ? undefined : (j && j.message) || ('HTTP ' + r.status) });
  } catch (e) {
    return res.status(500).json({ success: false });
  }
};
