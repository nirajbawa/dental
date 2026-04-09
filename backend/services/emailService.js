const nodemailer = require('nodemailer');

// ─── Lazy transporter — reads .env at send time, not at module load ───────────
// This means you can update .env and restart without code changes
const getTransporter = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass || user === 'your_gmail@gmail.com' || pass === 'your_16_char_app_password') {
    return null; // not configured
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
  });
};

// ─── Date formatter ───────────────────────────────────────────────────────────
const fmtDate = (dateStr) => {
  // Handle both 'YYYY-MM-DD' and ISO strings from MySQL
  const clean = String(dateStr).substring(0, 10);
  return new Date(clean + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
};

// ─── Shared HTML blocks ───────────────────────────────────────────────────────
const header = (bannerBg, bannerColor, bannerText) => `
<!DOCTYPE html><html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
<tr><td align="center">
<table width="100%" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <tr>
    <td style="background:#1a6b8a;padding:28px 36px;text-align:center;">
      <p style="margin:0 0 8px;display:inline-block;background:rgba(255,255,255,0.2);border-radius:10px;width:44px;height:44px;line-height:44px;font-size:22px;font-weight:700;color:#fff;">+</p>
      <h1 style="margin:8px 0 4px;color:#fff;font-size:18px;font-weight:700;">The Smile Dental Clinic</h1>
      <p style="margin:0;color:rgba(255,255,255,0.8);font-size:12px;">Dr. Manjiri Salkar — Nashik, Maharashtra</p>
    </td>
  </tr>
  <tr>
    <td style="background:${bannerBg};padding:12px 36px;text-align:center;border-bottom:1px solid ${bannerColor};">
      <p style="margin:0;color:${bannerColor};font-size:14px;font-weight:600;">${bannerText}</p>
    </td>
  </tr>`;

const footer = `
  <tr>
    <td style="background:#f8fafc;padding:18px 36px;text-align:center;border-top:1px solid #e2e8f0;">
      <p style="margin:0;color:#94a3b8;font-size:11px;line-height:1.7;">
        Automated email from The Smile Dental Clinic.<br/>
        To reschedule: WhatsApp +91 82629 36861
      </p>
    </td>
  </tr>
</table></td></tr></table></body></html>`;

const detailsTable = (date, time, treatment, paymentHtml) => `
<table width="100%" cellpadding="0" cellspacing="0"
  style="background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:24px;">
  <tr><td style="padding:18px 22px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;">
        <span style="color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Date</span>
        <p style="margin:4px 0 0;color:#1e293b;font-size:14px;font-weight:600;">${date}</p>
      </td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;">
        <span style="color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Time</span>
        <p style="margin:4px 0 0;color:#1e293b;font-size:14px;font-weight:600;">${time}</p>
      </td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;">
        <span style="color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Treatment</span>
        <p style="margin:4px 0 0;color:#1e293b;font-size:14px;font-weight:600;">${treatment}</p>
      </td></tr>
      <tr><td style="padding:8px 0;">
        <span style="color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Payment</span>
        <p style="margin:4px 0 0;font-size:13px;">${paymentHtml}</p>
      </td></tr>
    </table>
  </td></tr>
</table>`;

const waButton = `
<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:4px;">
  <tr><td align="center">
    <a href="https://wa.me/918262936861?text=Hello%20I%20have%20a%20query%20about%20my%20appointment"
      style="display:inline-block;background:#25d366;color:#fff;text-decoration:none;padding:11px 26px;border-radius:8px;font-size:13px;font-weight:600;">
      Contact on WhatsApp
    </a>
  </td></tr>
</table>`;

// ─── 1. Booking Confirmation ──────────────────────────────────────────────────
const buildBookingEmail = ({ name, date, time, treatment_type, payment_status }) => {
  const payHtml = payment_status === 'completed'
    ? '<span style="color:#16a34a;font-weight:600;">Paid Online — Rs. 400</span>'
    : '<span style="color:#d97706;font-weight:600;">Pay at Clinic — Rs. 400</span>';

  return header('#dcfce7', '#16a34a', 'Appointment Confirmed') + `
  <tr><td style="padding:32px 36px;">
    <p style="margin:0 0 16px;color:#475569;font-size:14px;">Dear <strong style="color:#1e293b;">${name}</strong>,</p>
    <p style="margin:0 0 24px;color:#475569;font-size:13px;line-height:1.7;">
      Your appointment at <strong>The Smile Dental Clinic</strong> has been confirmed.
    </p>
    ${detailsTable(fmtDate(date), time, treatment_type, payHtml)}
    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:#fffbeb;border-radius:8px;border:1px solid #fde68a;margin-bottom:24px;">
      <tr><td style="padding:12px 16px;">
        <p style="margin:0;color:#92400e;font-size:12px;line-height:1.7;">
          Please arrive 5–10 minutes early and bring any previous dental records.
        </p>
      </td></tr>
    </table>
    <p style="margin:0 0 4px;color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Location</p>
    <p style="margin:0 0 24px;color:#475569;font-size:13px;line-height:1.6;">
      Gaurav Accident Clinic, Nashik, Maharashtra<br/>Mon–Sat: 10:30 AM – 7:30 PM
    </p>
    ${waButton}
  </td></tr>` + footer;
};

// ─── 2. Day-Before Reminder ───────────────────────────────────────────────────
const buildReminderEmail = ({ name, date, time, treatment_type, payment_status }) => {
  const payHtml = payment_status === 'completed'
    ? '<span style="color:#16a34a;font-weight:600;">Already Paid — Rs. 400</span>'
    : '<span style="color:#d97706;font-weight:600;">Pay at Clinic — Rs. 400</span>';

  return header('#fef3c7', '#92400e', 'Your Appointment is Tomorrow') + `
  <tr><td style="padding:32px 36px;">
    <p style="margin:0 0 16px;color:#475569;font-size:14px;">Dear <strong style="color:#1e293b;">${name}</strong>,</p>
    <p style="margin:0 0 24px;color:#475569;font-size:13px;line-height:1.7;">
      Friendly reminder — you have a dental appointment <strong>tomorrow</strong> at
      <strong>The Smile Dental Clinic</strong>.
    </p>
    ${detailsTable(fmtDate(date), time, treatment_type, payHtml)}
    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:#eff6ff;border-radius:8px;border:1px solid #bfdbfe;margin-bottom:24px;">
      <tr><td style="padding:14px 16px;">
        <p style="margin:0 0 8px;color:#1e40af;font-size:12px;font-weight:600;">Before Your Visit</p>
        <ul style="margin:0;padding-left:16px;color:#3730a3;font-size:12px;line-height:1.9;">
          <li>Arrive 5–10 minutes before your appointment</li>
          <li>Bring any previous dental X-rays or records</li>
          <li>Inform us of any current medications</li>
          ${payment_status !== 'completed' ? '<li>Carry Rs. 400 for the consultation fee</li>' : ''}
        </ul>
      </td></tr>
    </table>
    <p style="margin:0 0 4px;color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Location</p>
    <p style="margin:0 0 24px;color:#475569;font-size:13px;line-height:1.6;">
      Gaurav Accident Clinic, Nashik, Maharashtra<br/>Mon–Sat: 10:30 AM – 7:30 PM
    </p>
    ${waButton}
  </td></tr>` + footer;
};

// ─── 3. Appointment Rejection ─────────────────────────────────────────────────
const buildRejectionEmail = ({ name, date, time, treatment_type }) => {
  return header('#fee2e2', '#dc2626', 'Appointment Cancelled') + `
  <tr><td style="padding:32px 36px;">
    <p style="margin:0 0 16px;color:#475569;font-size:14px;">Dear <strong style="color:#1e293b;">${name}</strong>,</p>
    <p style="margin:0 0 24px;color:#475569;font-size:13px;line-height:1.7;">
      We regret to inform you that your appointment at <strong>The Smile Dental Clinic</strong>
      has been cancelled due to an unforeseen emergency. We sincerely apologize for the inconvenience caused.
    </p>
    ${detailsTable(fmtDate(date), time, treatment_type, '<span style="color:#94a3b8;">—</span>')}
    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:#fffbeb;border-radius:8px;border:1px solid #fde68a;margin-bottom:24px;">
      <tr><td style="padding:12px 16px;">
        <p style="margin:0;color:#92400e;font-size:12px;line-height:1.7;">
          We kindly request you to reschedule your appointment at a convenient time.
          Please contact us via WhatsApp or visit our clinic during working hours.
        </p>
      </td></tr>
    </table>
    ${waButton}
  </td></tr>` + footer;
};
const sendMail = async ({ to, subject, html, label }) => {
  if (!to || to === 'undefined') {
    console.error(`📧 [${label}] ERROR: recipient email is missing`);
    return;
  }

  const transport = getTransporter();

  if (!transport) {
    console.log(`\n📧 [${label}] EMAIL NOT CONFIGURED`);
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   → Add EMAIL_USER + EMAIL_PASS to .env and restart backend\n`);
    return;
  }

  try {
    const info = await transport.sendMail({
      from: process.env.EMAIL_FROM || `The Smile Dental Clinic <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    console.log(`📧 [${label}] Sent → ${to} (${info.messageId})`);
  } catch (err) {
    console.error(`📧 [${label}] FAILED → ${to}: ${err.message}`);
  }
};

// ─── Public API ───────────────────────────────────────────────────────────────
const sendBookingConfirmation = ({ email, name, date, time, treatment_type, payment_status }) => {
  sendMail({
    to: email,
    subject: `Appointment Confirmed — ${date} at ${time} | The Smile Dental Clinic`,
    html: buildBookingEmail({ name, date, time, treatment_type, payment_status }),
    label: 'BOOKING CONFIRMATION'
  });
};

const sendDayBeforeReminder = ({ email, name, date, time, treatment_type, payment_status }) => {
  return sendMail({
    to: email,
    subject: `Reminder: Your Appointment is Tomorrow at ${time} | The Smile Dental Clinic`,
    html: buildReminderEmail({ name, date, time, treatment_type, payment_status }),
    label: 'DAY-BEFORE REMINDER'
  });
};

const sendRejectionEmail = ({ email, name, date, time, treatment_type }) => {
  sendMail({
    to: email,
    subject: `Appointment Update — The Smile Dental Clinic`,
    html: buildRejectionEmail({ name, date, time, treatment_type }),
    label: 'REJECTION EMAIL'
  });
};

module.exports = { sendBookingConfirmation, sendDayBeforeReminder, sendRejectionEmail };
