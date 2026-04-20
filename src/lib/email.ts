import { Resend } from 'resend';
import { formatDate, formatTime, formatPrice } from './constants';
import type { Appointment } from '@/types';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendBookingConfirmation(appointment: Appointment) {
  const svc = appointment.services!;

  if (!appointment.customer_email) return;

  const dateStr = formatDate(appointment.date);
  const timeStr = `${formatTime(appointment.start_time)} – ${formatTime(appointment.end_time)}`;
  const confirmationId = appointment.id.slice(0, 8).toUpperCase();
  const baseUrl = process.env.APP_PUBLIC_URL || process.env.NEXT_PUBLIC_APP_URL;
  const cancelUrl = `${baseUrl}/book/cancel?token=${appointment.cancel_token}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Booking Confirmed – The Jolly Barber</title>
</head>
<body style="margin:0;padding:0;background-color:#fff8f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fff8f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Header -->
          <tr>
            <td style="background-color:#1a1a1a;border-bottom:4px solid #f5a7c0;border-radius:16px 16px 0 0;padding:28px 32px;text-align:center;">
              ${process.env.LOGO_PUBLIC_URL ? `<img src="${process.env.LOGO_PUBLIC_URL}" width="90" height="90" alt="The Jolly Barber" style="border-radius:50%;border:3px solid #f5a7c0;display:block;margin:0 auto 12px;" />` : `<div style="width:90px;height:90px;border-radius:50%;background-color:#f5a7c0;border:3px solid #f5a7c0;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;font-size:36px;line-height:90px;text-align:center;">✂</div>`}
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:900;letter-spacing:1px;text-transform:uppercase;">The Jolly Barber</h1>
              <p style="margin:4px 0 0;color:#f9a8d4;font-size:11px;letter-spacing:3px;text-transform:uppercase;font-weight:700;">Booking Confirmed</p>
            </td>
          </tr>

          <!-- You're booked banner -->
          <tr>
            <td style="background-color:#ee3d82;padding:20px 32px;text-align:center;">
              <p style="margin:0;color:#ffffff;font-size:24px;font-weight:900;letter-spacing:1px;">✂ You're booked!</p>
              <p style="margin:6px 0 0;color:#fce7f3;font-size:14px;">See you soon — please arrive a few minutes early.</p>
            </td>
          </tr>

          <!-- Details card -->
          <tr>
            <td style="background-color:#ffffff;padding:0 32px;">

              <!-- Confirmation ID -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border-bottom:1px solid #fce7f3;padding:16px 0;">
                <tr>
                  <td style="color:#9ca3af;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">Confirmation</td>
                  <td align="right" style="color:#1a1a1a;font-size:14px;font-weight:700;font-family:monospace;">${confirmationId}</td>
                </tr>
              </table>

              ${row('Service', svc.name)}
              ${row('Date', dateStr)}
              ${row('Time', timeStr)}
              ${row('Duration', `${svc.duration} min`)}
              ${row('Price', formatPrice(svc.price))}
              ${row('Name', appointment.customer_name)}
              ${row('Phone', appointment.customer_phone)}
              ${appointment.notes ? row('Notes', appointment.notes) : ''}
            </td>
          </tr>

          <!-- Cancel link -->
          <tr>
            <td style="background-color:#fff8f5;padding:20px 32px;text-align:center;border-top:2px solid #fce7f3;">
              <p style="margin:0 0 12px;color:#9ca3af;font-size:13px;">Need to cancel? You can do it here:</p>
              <a href="${cancelUrl}" style="display:inline-block;padding:12px 24px;background-color:#ffffff;border:2px solid #fce7f3;border-radius:12px;color:#ee3d82;font-size:13px;font-weight:700;text-decoration:none;letter-spacing:0.5px;">
                Cancel my appointment
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#ffffff;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;border-top:2px solid #fce7f3;">
              <p style="margin:0;color:#d1d5db;font-size:12px;">© The Jolly Barber</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  await resend.emails.send({
    from: 'The Jolly Barber <onboarding@resend.dev>',
    to: appointment.customer_email,
    subject: `✂ Booking confirmed — ${dateStr} at ${formatTime(appointment.start_time)}`,
    html,
  });
}

function row(label: string, value: string): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-bottom:1px solid #fce7f3;padding:14px 0;">
      <tr>
        <td style="color:#9ca3af;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">${label}</td>
        <td align="right" style="color:#1a1a1a;font-size:14px;font-weight:600;max-width:280px;text-align:right;">${value}</td>
      </tr>
    </table>
  `;
}
