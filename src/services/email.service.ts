import nodemailer from "nodemailer";
import { env } from "../config/env";

type SendEmailParams = {
  to: string;
  cc?: string;
  subject: string;
  html: string;
};

export async function sendEmail(params: SendEmailParams) {
  if (
    !env.smtpHost ||
    !env.smtpPort ||
    !env.smtpUser ||
    !env.smtpPass ||
    !env.smtpFrom
  ) {
    throw new Error("SMTP configuration is missing in backend .env.");
  }

  const transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: Number(env.smtpPort),
    secure: env.smtpSecure,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  });

  const result = await transporter.sendMail({
    from: env.smtpFrom,
    to: params.to,
    cc: params.cc || undefined,
    subject: params.subject,
    html: params.html,
  });

  return result;
}