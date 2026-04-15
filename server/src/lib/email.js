import { Resend } from "resend";

let resend;

if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
}

const SENDER_EMAIL = "ResolveIt Notifications <onboarding@resend.dev>"; // Use a verified domain in production

export const sendEmailNotification = async ({ to, subject, html }) => {
  if (!resend) {
    console.warn("RESEND_API_KEY not configured. Skipping email to:", to);
    return false;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: SENDER_EMAIL,
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error("Resend Email Error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to send email via Resend:", error);
    return false;
  }
};
