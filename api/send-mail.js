import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { name, email, message, antibot, hp } = req.body || {};
    if (hp) return res.status(400).json({ error: 'Anti-bot déclenché' });

    const a = Number(antibot?.a ?? 0);
    const b = Number(antibot?.b ?? 0);
    const answer = Number(antibot?.answer ?? -999);
    if (a + b !== answer) return res.status(400).json({ error: 'Validation anti-bot incorrecte' });

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Champs manquants' });
    }

    const {
      SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, MAIL_TO, MAIL_FROM
    } = process.env;

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !MAIL_TO) {
      return res.status(500).json({ error: 'Config SMTP incomplète' });
    }

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: String(SMTP_SECURE || '').toLowerCase() === 'true',
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    const fromAddr = MAIL_FROM || SMTP_USER;
    const subject = `Contact site — ${name}`;

    await transporter.sendMail({
      from: `"Site Paul Roy" <${fromAddr}>`,
      to: MAIL_TO,
      subject,
      replyTo: email,
      text: `De: ${name} <${email}>\n\n${message}`,
      html: `<p><b>De:</b> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
             <p style="white-space:pre-wrap">${escapeHtml(message)}</p>`,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Mailer error:', err);
    return res.status(500).json({ error: 'Erreur envoi e-mail' });
  }
}

function escapeHtml(str = '') {
  return str.replace(/[&<>"']/g, (s) => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[s]));
}
