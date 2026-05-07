import * as Brevo from "@getbrevo/brevo";
import "dotenv/config";

const apiInstance = new Brevo.TransactionalEmailsApi();
apiInstance.authentications["apiKey"].apiKey = process.env.BREVO_API_KEY;

export const sendInviteEmail = async ({ to, name, acceptUrl }) => {
  const sendSmtpEmail = new Brevo.SendSmtpEmail();

  sendSmtpEmail.subject = "You're invited to join the Faculty Portal";
  sendSmtpEmail.sender = {
    name: "Faculty Portal",
    email: process.env.BREVO_SENDER_EMAIL,
  };
  sendSmtpEmail.to = [{ email: to, name }];
  sendSmtpEmail.htmlContent = `
    <div style="font-family:sans-serif;max-width:480px;margin:auto">
      <h2>Welcome, ${name}!</h2>
      <p>You've been invited by the admin to join the <strong>Faculty Portal</strong>.</p>
      <p>Click the button below to set up your account. This link expires in <strong>24 hours</strong>.</p>
      <a href="${acceptUrl}"
         style="display:inline-block;margin-top:16px;padding:12px 24px;
                background:#059669;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
        Accept Invite
      </a>
      <p style="margin-top:24px;color:#6b7280;font-size:13px">
        If you weren't expecting this, you can safely ignore it.
      </p>
    </div>
  `;

  await apiInstance.sendTransacEmail(sendSmtpEmail);
};
