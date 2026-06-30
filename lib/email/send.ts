import { Resend } from "resend";

export async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[email skipped, no RESEND_API_KEY] to=${to} subject=${subject}`);
    return;
  }
  const resend = new Resend(apiKey);
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "Payroll OS <onboarding@resend.dev>",
      to,
      subject,
      html
    });
  } catch (err) {
    console.error("Email send failed", err);
  }
}
