import nodemailer from "nodemailer";
import { google } from "googleapis";
import "dotenv/config";

const oauth2Client = new google.auth.OAuth2(
  process.env.OAUTH_CLIENT_ID,
  process.env.OAUTH_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground",
);

oauth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN,
});

export const sendInviteEmail = async ({ to, name, acceptUrl }) => {
  // Fresh access token every time — never expires
  const accessToken = await oauth2Client.getAccessToken();

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: process.env.GMAIL_USER,
      clientId: process.env.OAUTH_CLIENT_ID,
      clientSecret: process.env.OAUTH_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN,
      accessToken: accessToken.token,
    },
  });

  await transporter.sendMail({
    from: `"Faculty Portal" <${process.env.GMAIL_USER}>`,
    to,
    subject: "You're invited to join the Faculty Portal",
    html: `
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
    `,
  });
};
