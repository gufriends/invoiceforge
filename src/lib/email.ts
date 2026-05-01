import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@invoiceforge.id";
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const appName = process.env.NEXT_PUBLIC_APP_NAME || "InvoiceForge";

const resend = apiKey ? new Resend(apiKey) : null;

export async function sendEmail(opts: { to: string; subject: string; html: string }) {
  if (!resend) {
    console.warn("[EMAIL] RESEND_API_KEY tidak diset — email diabaikan", { to: opts.to, subject: opts.subject });
    return { skipped: true };
  }
  const { error } = await resend.emails.send({
    from: fromEmail,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
  if (error) throw new Error(`Gagal kirim email: ${error.message}`);
  return { skipped: false };
}

export function buildResetPasswordEmail(opts: { name: string; resetUrl: string }) {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f172a">
      <h1 style="color:#2563eb;margin-bottom:16px">${appName}</h1>
      <p>Halo ${opts.name},</p>
      <p>Kami menerima permintaan reset password untuk akun kamu. Klik tombol di bawah untuk membuat password baru:</p>
      <p style="margin:24px 0">
        <a href="${opts.resetUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:600">
          Reset Password
        </a>
      </p>
      <p style="color:#64748b;font-size:13px">Link ini berlaku 1 jam. Kalau bukan kamu yang minta, abaikan saja email ini.</p>
      <p style="color:#64748b;font-size:13px;word-break:break-all">Atau buka link: ${opts.resetUrl}</p>
      <hr style="margin:24px 0;border:none;border-top:1px solid #e2e8f0" />
      <p style="color:#94a3b8;font-size:12px">${appName} • ${appUrl}</p>
    </div>
  `;
}
