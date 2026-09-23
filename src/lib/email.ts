/**
 * Email system for Hackmitten 3.0.
 *
 * Sends the team leader's approval email when their team is approved.
 *
 * Provider priority:
 *   1. Resend in production.
 *   2. Console logging in local development only.
 *
 * Always returns { success, message, provider } for tracking.
 */

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface EmailResult {
  success: boolean;
  message: string;
  provider: "resend" | "console" | "configuration";
}

/**
 * Send an email. Production requires both Resend and a configured sender.
 */
export async function sendEmail(payload: EmailPayload): Promise<EmailResult> {
  const isProduction = process.env.NODE_ENV === "production";
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.EMAIL_FROM?.trim();

  if (!resendApiKey) {
    if (isProduction) {
      return { success: false, message: "RESEND_API_KEY is not configured in production", provider: "configuration" };
    }
    console.log("[email] development console fallback", { to: payload.to, subject: payload.subject });
    return { success: true, message: "Email logged in development (RESEND_API_KEY not configured)", provider: "console" };
  }

  if (!fromAddress) {
    if (isProduction) {
      return { success: false, message: "EMAIL_FROM is not configured in production", provider: "configuration" };
    }
    console.log("[email] development console fallback", { to: payload.to, subject: payload.subject });
    return { success: true, message: "Email logged in development (EMAIL_FROM not configured)", provider: "console" };
  }

  // ─── Resend provider ─────────────────────────────────────────────────
  {
    try {
      // Lazy import so the dependency is only loaded when actually needed.
      const { Resend } = await import("resend");
      const resend = new Resend(resendApiKey);
      const { data, error } = await resend.emails.send({
        from: fromAddress,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      });
      if (error) {
        return { success: false, message: `Resend error: ${error.message}`, provider: "resend" };
      }
      return { success: true, message: `Email sent via Resend (${data?.id ?? "—"})`, provider: "resend" };
    } catch (err) {
      return {
        success: false,
        message: `Failed to send via Resend: ${err instanceof Error ? err.message : "unknown"}`,
        provider: "resend",
      };
    }
  }

  // ─── Dev mode (console logging) ───────────────────────────────────────
  console.log("\n📧 EMAIL (dev mode — not actually sent)");
  console.log("  To:", payload.to);
  console.log("  Subject:", payload.subject);
  console.log("  Text:", payload.text.slice(0, 200));
  console.log("");
  return { success: true, message: "Email logged (dev mode — no RESEND_API_KEY configured)", provider: "console" };
}

/**
 * Generate the approval email HTML for a participant.
 */
export function approvalEmailHtml(opts: {
  participantName: string;
  teamName: string;
  registrationId: string;
  participantId: string;
  passUrl: string;
  whatsappGroupUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#030303;font-family:'Inter',Arial,sans-serif;color:#F2F2F2;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#030303;min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#080808;border:1px solid rgba(255,255,255,0.1);border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:40px 40px 20px;text-align:center;">
              <div style="font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#B52A32;">HACKMITTEN 3.0</div>
              <h1 style="font-size:32px;font-weight:700;color:#F2F2F2;margin:16px 0 8px;">TEAM APPROVED.</h1>
              <p style="font-size:14px;color:#A8A8A8;margin:0;">Your team has been approved for Hackmitten 3.0.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#151515;border-radius:8px;">
                <tr><td style="padding:16px 20px;font-family:'JetBrains Mono',monospace;font-size:11px;color:#A8A8A8;">TEAM</td><td style="padding:16px 20px;font-size:16px;color:#F2F2F2;font-weight:600;text-align:right;">${opts.teamName}</td></tr>
                <tr><td style="padding:16px 20px;font-family:'JetBrains Mono',monospace;font-size:11px;color:#A8A8A8;border-top:1px solid rgba(255,255,255,0.05);">REGISTRATION ID</td><td style="padding:16px 20px;font-family:'JetBrains Mono',monospace;font-size:16px;color:#B52A32;font-weight:600;text-align:right;border-top:1px solid rgba(255,255,255,0.05);">${opts.registrationId}</td></tr>
                <tr><td style="padding:16px 20px;font-family:'JetBrains Mono',monospace;font-size:11px;color:#A8A8A8;border-top:1px solid rgba(255,255,255,0.05);">PARTICIPANT</td><td style="padding:16px 20px;font-size:16px;color:#F2F2F2;font-weight:600;text-align:right;border-top:1px solid rgba(255,255,255,0.05);">${opts.participantName}</td></tr>
                <tr><td style="padding:16px 20px;font-family:'JetBrains Mono',monospace;font-size:11px;color:#A8A8A8;border-top:1px solid rgba(255,255,255,0.05);">PARTICIPANT ID</td><td style="padding:16px 20px;font-family:'JetBrains Mono',monospace;font-size:16px;color:#B52A32;font-weight:600;text-align:right;border-top:1px solid rgba(255,255,255,0.05);">${opts.participantId}</td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px 40px;text-align:center;">
              <a href="${opts.whatsappGroupUrl}" style="display:inline-block;background:#B52A32;color:#F2F2F2;text-decoration:none;padding:14px 36px;border-radius:999px;font-size:14px;font-weight:600;letter-spacing:1px;">JOIN HACKMITTEN WHATSAPP GROUP</a>
              <p style="font-size:12px;color:#A8A8A8;margin:16px 0 0;">Please join the official team group and keep your registration details available for the event.</p>
              <a href="${opts.passUrl}" style="display:inline-block;color:#F2F2F2;text-decoration:underline;margin-top:16px;font-size:13px;">VIEW YOUR DIGITAL PASS</a>
              <p style="font-size:12px;color:#A8A8A8;margin:16px 0 0;">Present the QR code on your pass at the food check-in counter.</p>
            </td>
          </tr>
        </table>
        <p style="font-size:11px;color:#A8A8A8;margin:24px 0 0;opacity:0.6;">© 2026 Hackmitten · Black is the universe · White is information · Red is energy</p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function approvalEmailText(opts: {
  participantName: string;
  teamName: string;
  registrationId: string;
  participantId: string;
  passUrl: string;
  whatsappGroupUrl: string;
}): string {
  return `HACKMITTEN 3.0 — TEAM APPROVED.

Your team has been approved for Hackmitten 3.0.

Team: ${opts.teamName}
Registration ID: ${opts.registrationId}
Participant: ${opts.participantName}
Participant ID: ${opts.participantId}

Join the official Hackmitten 3.0 WhatsApp group: ${opts.whatsappGroupUrl}

View your digital pass: ${opts.passUrl}

Present the QR code on your pass at the food check-in counter.

© 2026 Hackmitten`.trim();
}
