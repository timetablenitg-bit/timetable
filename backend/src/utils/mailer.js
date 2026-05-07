import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";
import "dotenv/config";

const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY,
});

export const sendInviteEmail = async ({ to, name, acceptUrl }) => {
  const sentFrom = new Sender(
    `noreply@${process.env.MAILERSEND_DOMAIN}`,
    "Faculty Portal",
  );

  const recipients = [new Recipient(to, name)];

  const emailParams = new EmailParams()
    .setFrom(sentFrom)
    .setTo(recipients)
    .setSubject("You're invited to join the Faculty Portal").setHtml(`
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
    `);

  await mailerSend.email.send(emailParams);
};
