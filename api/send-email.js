// api/send-email.js
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const { name, email, phone, message, antibot, hp } = req.body || {};

    // Anti-bot : honeypot
    if (hp) return res.status(400).json({ error: "Anti-bot déclenché" });

    // Anti-bot : petite addition
    const a = Number(antibot?.a ?? 0);
    const b = Number(antibot?.b ?? 0);
    const answer = Number(antibot?.answer ?? -999);
    if (a + b !== answer) return res.status(400).json({ error: "Validation anti-bot incorrecte" });

    // Champs obligatoires
    if (!name || !email || !message) {
      return res.status(400).json({ error: "Champs manquants" });
    }

    const { SMTP_USER, SMTP_PASS, MAIL_TO } = process.env;
    if (!SMTP_USER || !SMTP_PASS || !MAIL_TO) {
      return res.status(500).json({ error: "Config SMTP incomplète" });
    }

    // Gmail SMTP (recommandé : mot de passe d’application)
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    // Corps du mail (texte + HTML)
    const footerTxt =
      `\n\n—\nNom/Prénom : ${name}\nE-mail : ${email}\nTéléphone : ${phone || "—"}`;
    const footerHtml =
      `<hr style="border:none;border-top:1px solid #ddd;margin:16px 0" />
       <p style="margin:0;line-height:1.6">
         <b>Nom/Prénom :</b> ${escapeHtml(name)}<br/>
         <b>E-mail :</b> ${escapeHtml(email)}<br/>
         <b>Téléphone :</b> ${escapeHtml(phone || "—")}
       </p>`;

    const info = await transporter.sendMail({
      from: `"Site Paul Roy" <${SMTP_USER}>`,       // from = ton gmail (DMARC ok)
      to: MAIL_TO,
      replyTo: `${name} <${email}>`,                // tu peux répondre direct
      subject: "Nouveau message (site Paul Roy)",
      text: `${message}${footerTxt}`,
      html: `<p style="white-space:pre-wrap;margin:0 0 8px">${escapeHtml(message)}</p>${footerHtml}`,
    });

    return res.status(200).json({ ok: true, id: info.messageId });
  } catch (err) {
    console.error("Mailer error:", err);
    return res.status(500).json({ error: "Échec de l’envoi" });
  }
}

function escapeHtml(str = "") {
  return str.replace(/[&<>"']/g, (s) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[s]));
}
