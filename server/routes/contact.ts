import { Router } from "express";
import nodemailer from "nodemailer";

const router = Router();

const toPort = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

router.post("/", async (req, res) => {
  try {
    const {
      name = "",
      email = "",
      phone = "",
      subject = "",
      message = "",
    } = req.body || {};

    if (!String(name).trim() || !String(email).trim() || !String(subject).trim() || !String(message).trim()) {
      return res.status(400).json({ error: "Name, email, subject and message are required." });
    }

    const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
    const smtpPort = toPort(process.env.SMTP_PORT, 587);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const receiverEmail = process.env.CONTACT_RECEIVER_EMAIL || "dhruvsutariya06@gmail.com";

    if (!smtpUser || !smtpPass) {
      return res.status(500).json({
        error: "Email service is not configured. Please set SMTP_USER and SMTP_PASS in server env.",
      });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const safeName = String(name).trim();
    const safeEmail = String(email).trim();
    const safePhone = String(phone).trim() || "Not provided";
    const safeSubject = String(subject).trim();
    const safeMessage = String(message).trim();

    await transporter.sendMail({
      from: `Auto Garage Contact <${smtpUser}>`,
      to: receiverEmail,
      replyTo: safeEmail,
      subject: `Contact Form: ${safeSubject}`,
      text: [
        `Name: ${safeName}`,
        `Email: ${safeEmail}`,
        `Phone: ${safePhone}`,
        "",
        "Message:",
        safeMessage,
      ].join("\n"),
      html: `
        <h2>New Contact Form Message</h2>
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Phone:</strong> ${safePhone}</p>
        <p><strong>Subject:</strong> ${safeSubject}</p>
        <p><strong>Message:</strong></p>
        <p>${safeMessage.replace(/\n/g, "<br/>")}</p>
      `,
    });

    return res.json({ success: true, message: "Message sent successfully." });
  } catch (error) {
    console.error("Contact message send failed:", error);
    return res.status(500).json({ error: "Failed to send message. Please try again." });
  }
});

export default router;
