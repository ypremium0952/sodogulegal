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
