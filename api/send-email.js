// api/send-email.js
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { name, email, message } = req.body || {};
  if (!name || !email || !message) {
    return res.status(400).json({ error: "Champs manquants" });
  }

  try {
    // config Gmail
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER, // ton Gmail
        pass: process.env.SMTP_PASS, // mot de passe d’application
      },
    });

    await transporter.sendMail({
      from: `"${name}" <${email}>`,
      to: process.env.MAIL_TO, // destinataire
      subject: "Nouveau message du site Paul Roy",
      text: message,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Erreur d’envoi:", err);
    return res.status(500).json({ error: "Échec de l’envoi" });
  }
}
