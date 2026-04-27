const { Resend } = require('resend');

const FROM = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const APP_URL = process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:5173';

let _client = null;
function client() {
  if (!_client) {
    if (!process.env.RESEND_API_KEY) {
      console.warn('[email] RESEND_API_KEY missing — emails will fail');
    }
    _client = new Resend(process.env.RESEND_API_KEY);
  }
  return _client;
}

const wrap = (title, body) => `
  <div style="font-family:'IBM Plex Sans',Arial,sans-serif;background:#F9F8F6;padding:32px;color:#1A1D1B;">
    <div style="max-width:560px;margin:0 auto;background:#FFFFFF;border:1px solid #E5E0D8;border-radius:8px;padding:32px;">
      <h1 style="font-family:'Work Sans',Arial,sans-serif;font-weight:600;font-size:22px;margin:0 0 16px;color:#3A5A40;">${title}</h1>
      ${body}
      <hr style="border:none;border-top:1px solid #E5E0D8;margin:24px 0;" />
      <p style="font-size:12px;color:#646965;margin:0;">Sent by Subscription Overload Manager</p>
    </div>
  </div>`;

async function sendVerificationEmail(to, token) {
  const link = `${APP_URL}/verify-email?token=${token}`;
  const html = wrap(
    'Verify your email',
    `<p>Welcome aboard! Please confirm your email address to unlock renewal reminders and budget alerts.</p>
     <p style="margin:24px 0;"><a href="${link}" style="display:inline-block;background:#3A5A40;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;">Verify email</a></p>
     <p style="font-size:13px;color:#646965;">Or paste this link: ${link}</p>`
  );
  return client().emails.send({ from: FROM, to, subject: 'Verify your email', html });
}

async function sendResetEmail(to, token) {
  const link = `${APP_URL}/reset-password?token=${token}`;
  const html = wrap(
    'Reset your password',
    `<p>You requested a password reset. The link below is valid for 1 hour.</p>
     <p style="margin:24px 0;"><a href="${link}" style="display:inline-block;background:#3A5A40;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;">Reset password</a></p>
     <p style="font-size:13px;color:#646965;">If you did not request this, you can safely ignore this email.</p>`
  );
  return client().emails.send({ from: FROM, to, subject: 'Reset your password', html });
}

async function sendRenewalReminder(to, sub) {
  const html = wrap(
    'Upcoming renewal',
    `<p>Your subscription <strong>${sub.serviceName}</strong> renews on
     <strong>${new Date(sub.renewalDate).toDateString()}</strong> for
     <strong>$${sub.cost.toFixed(2)}</strong> (${sub.billingCycle}).</p>
     <p>Review it in your dashboard if you no longer need it.</p>`
  );
  return client().emails.send({ from: FROM, to, subject: `Renewal reminder: ${sub.serviceName}`, html });
}

async function sendTestEmail(to, name) {
  const html = wrap(
    'Email check passed',
    `<p>Hi ${name || 'there'} — this is an instant test email confirming your inbox is reachable from Subscription Overload Manager.</p>
     <p>You can now trust that renewal and budget alerts will land here.</p>`
  );
  return client().emails.send({ from: FROM, to, subject: 'Test email · Subscription Overload Manager', html });
}

async function sendBudgetAlert(to, name, totalMonthly, budget, currency = '$') {
  const html = wrap(
    'Budget limit reached',
    `<p>Hi ${name || 'there'},</p>
     <p>Your subscription spending this month has reached your budget limit:</p>
     <ul style="margin:16px 0;padding-left:24px;">
       <li><strong>Monthly Budget:</strong> ${currency}${budget.toFixed(2)}</li>
       <li><strong>Current Spend:</strong> ${currency}${totalMonthly.toFixed(2)}</li>
     </ul>
     <p>Consider reviewing your subscriptions to avoid overspending.</p>
     <p style="margin:24px 0;"><a href="${APP_URL}/dashboard" style="display:inline-block;background:#3A5A40;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;">Go to Dashboard</a></p>`
  );
  return client().emails.send({ from: FROM, to, subject: 'Budget alert · Subscription Overload Manager', html });
}

module.exports = { sendVerificationEmail, sendResetEmail, sendRenewalReminder, sendTestEmail, sendBudgetAlert };
