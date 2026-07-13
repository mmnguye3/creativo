// Agency-branded transactional email builder.
// All 4 order lifecycle emails use this helper to ensure the customer
// only ever sees the agency's brand — never Cretivo.

export interface AgencyBrand {
  agency_name: string;
  logo_url: string | null;
  primary_color: string | null;  // hex, e.g. "#f97316"
  contact_email: string | null;
}

/** Wraps body HTML in a consistent agency-branded email shell. */
export function buildAgencyEmail(
  brand: AgencyBrand,
  opts: { subject: string; bodyHtml: string },
): { subject: string; html: string } {
  const primary = brand.primary_color?.trim() || '#f97316';
  const name = brand.agency_name || 'Your Design Agency';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escHtml(opts.subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" role="presentation"
        style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.07);">

        <!-- ── Header ── -->
        <tr>
          <td style="background:${escHtml(primary)};padding:28px 32px;text-align:center;">
            ${brand.logo_url
              ? `<img src="${escHtml(brand.logo_url)}" alt="${escHtml(name)}" style="max-height:56px;max-width:220px;object-fit:contain;display:block;margin:0 auto;">`
              : `<h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">${escHtml(name)}</h1>`
            }
          </td>
        </tr>

        <!-- ── Body ── -->
        <tr>
          <td style="padding:36px 32px 28px;">
            ${opts.bodyHtml}
          </td>
        </tr>

        <!-- ── Footer ── -->
        <tr>
          <td style="padding:18px 32px 28px;border-top:1px solid #f0f0f0;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              ${escHtml(name)}${brand.contact_email
                ? ` · <a href="mailto:${escHtml(brand.contact_email)}" style="color:#9ca3af;text-decoration:none;">${escHtml(brand.contact_email)}</a>`
                : ''
              }
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject: opts.subject, html };
}

/** Sends one agency-branded email via Resend HTTP API. */
export async function sendAgencyEmail(opts: {
  resendApiKey: string;
  brand: AgencyBrand;
  to: string;
  subject: string;
  bodyHtml: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { html } = buildAgencyEmail(opts.brand, {
    subject: opts.subject,
    bodyHtml: opts.bodyHtml,
  });

  const fromName = (opts.brand.agency_name || 'Your Design Agency').replace(/[<>]/g, '');
  const from = `${fromName} <onboarding@resend.dev>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${opts.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [opts.to],
      subject: opts.subject,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return { ok: false, error: `Resend ${res.status}: ${body.slice(0, 300)}` };
  }
  return { ok: true };
}

// ── Email body builders ────────────────────────────────────────────────────

/** 1. Order Received — sent to customer right after they submit on the white-label site. */
export function buildOrderReceivedBody(opts: {
  customerName: string;
  orderRef: string;
  items: Array<{ service_name: string; quantity: number; price: number }>;
  notes: string | null;
  contactEmail: string | null;
  agencyName: string;
}): string {
  const itemRows = opts.items.map(i => `
    <tr>
      <td style="padding:9px 0;border-bottom:1px solid #f0f0f0;color:#374151;font-size:14px;">${escHtml(i.service_name)}</td>
      <td style="padding:9px 0;border-bottom:1px solid #f0f0f0;color:#374151;font-size:14px;text-align:right;">${i.quantity}× $${Number(i.price).toFixed(2)}</td>
    </tr>`).join('');

  return `
    <h2 style="margin:0 0 8px;font-size:22px;color:#111827;font-weight:700;">We've received your order! 🎉</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px;">Hi ${escHtml(opts.customerName)}, thanks for reaching out. We've received your project request and will be in touch soon with a quote and next steps.</p>

    <div style="background:#f9fafb;border-radius:8px;padding:18px 20px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.07em;font-weight:600;">Order Reference</p>
      <p style="margin:0;font-size:22px;font-weight:700;color:#111827;font-family:'Courier New',monospace;">#${escHtml(opts.orderRef)}</p>
    </div>

    ${opts.items.length > 0 ? `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:24px;">
      <tr>
        <td style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.07em;padding-bottom:8px;">Service</td>
        <td style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.07em;padding-bottom:8px;text-align:right;">Amount</td>
      </tr>
      ${itemRows}
    </table>` : ''}

    <div style="background:#eff6ff;border-left:3px solid #3b82f6;padding:13px 16px;border-radius:0 6px 6px 0;margin-bottom:20px;">
      <p style="margin:0;font-size:14px;color:#1e40af;font-weight:600;">What happens next?</p>
      <p style="margin:4px 0 0;font-size:13px;color:#3b82f6;">We'll review your request and send you a quote and secure payment link within 1 business day.</p>
    </div>

    ${opts.notes ? `
    <div style="background:#f8fafc;border-left:3px solid #94a3b8;padding:13px 16px;border-radius:0 6px 6px 0;margin-bottom:20px;">
      <p style="margin:0 0 3px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;">Your project notes</p>
      <p style="margin:0;font-size:13px;color:#374151;">${escHtml(opts.notes)}</p>
    </div>` : ''}

    <p style="margin:0;font-size:13px;color:#9ca3af;">Questions? Reach out to ${escHtml(opts.agencyName)}${opts.contactEmail ? ` at <a href="mailto:${escHtml(opts.contactEmail)}" style="color:#6b7280;">${escHtml(opts.contactEmail)}</a>` : ''}.</p>
  `;
}

/** 2. Quote Ready — sent when agency creates a payment link. */
export function buildQuoteReadyBody(opts: {
  customerName: string;
  orderRef: string;
  amountDollars: string;
  checkoutUrl: string;
  agencyName: string;
  contactEmail: string | null;
  primary: string;
}): string {
  return `
    <h2 style="margin:0 0 8px;font-size:22px;color:#111827;font-weight:700;">Your quote is ready 📋</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px;">Hi ${escHtml(opts.customerName)}, ${escHtml(opts.agencyName)} has reviewed your project and sent you a secure payment link.</p>

    <div style="background:#f9fafb;border-radius:8px;padding:18px 20px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td style="font-size:13px;color:#6b7280;padding:4px 0;">Order</td>
          <td style="font-size:13px;font-weight:700;color:#111827;padding:4px 0;text-align:right;font-family:'Courier New',monospace;">#${escHtml(opts.orderRef)}</td>
        </tr>
        <tr>
          <td style="font-size:13px;color:#6b7280;padding:4px 0;">Amount due</td>
          <td style="font-size:16px;font-weight:700;color:#16a34a;padding:4px 0;text-align:right;">$${escHtml(opts.amountDollars)}</td>
        </tr>
      </table>
    </div>

    <p style="margin:0 0 24px;">
      <a href="${escHtml(opts.checkoutUrl)}"
        style="display:inline-block;background:${escHtml(opts.primary)};color:#ffffff;padding:15px 32px;text-decoration:none;border-radius:8px;font-weight:700;font-size:16px;letter-spacing:-0.2px;">
        Pay Now — $${ opts.amountDollars}
      </a>
    </p>

    <p style="margin:0 0 12px;font-size:13px;color:#6b7280;">Or paste this link into your browser:</p>
    <p style="margin:0 0 24px;background:#f3f4f6;padding:10px 14px;border-radius:6px;font-family:'Courier New',monospace;font-size:12px;color:#374151;word-break:break-all;">${escHtml(opts.checkoutUrl)}</p>

    <p style="margin:0;font-size:12px;color:#9ca3af;">This payment is processed securely by Stripe. Questions? Contact ${escHtml(opts.agencyName)}${opts.contactEmail ? ` at <a href="mailto:${escHtml(opts.contactEmail)}" style="color:#9ca3af;">${escHtml(opts.contactEmail)}</a>` : ''}.</p>
  `;
}

/** 3. Order Delivered — sent when agency marks an order as delivered. */
export function buildOrderDeliveredBody(opts: {
  customerName: string;
  orderRef: string;
  deliveryNote: string | null;
  signedFiles: Array<{ name: string; signedUrl: string }>;
  agencyName: string;
  contactEmail: string | null;
}): string {
  const fileLinks = opts.signedFiles.map(f => `
    <a href="${escHtml(f.signedUrl)}"
      style="display:block;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px 18px;margin-bottom:10px;text-decoration:none;color:#111827;">
      <span style="font-size:14px;font-weight:600;">⬇ ${escHtml(f.name)}</span>
      <span style="display:block;font-size:11px;color:#9ca3af;margin-top:3px;">Click to download · link valid for 7 days</span>
    </a>`).join('');

  return `
    <h2 style="margin:0 0 8px;font-size:22px;color:#111827;font-weight:700;">Your project is ready! 🎨</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px;">Hi ${escHtml(opts.customerName)}, great news — we've completed your project. Your deliverables are ready to download below.</p>

    <div style="background:#f9fafb;border-radius:8px;padding:18px 20px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.07em;font-weight:600;">Order Reference</p>
      <p style="margin:0;font-size:22px;font-weight:700;color:#111827;font-family:'Courier New',monospace;">#${escHtml(opts.orderRef)}</p>
    </div>

    ${opts.deliveryNote ? `
    <div style="background:#f0fdf4;border-left:3px solid #16a34a;padding:13px 16px;border-radius:0 6px 6px 0;margin-bottom:24px;">
      <p style="margin:0 0 3px;font-size:11px;font-weight:700;color:#15803d;text-transform:uppercase;">Note from ${escHtml(opts.agencyName)}</p>
      <p style="margin:0;font-size:14px;color:#166534;">${escHtml(opts.deliveryNote)}</p>
    </div>` : ''}

    <h3 style="margin:0 0 12px;font-size:15px;font-weight:700;color:#111827;">Your Files</h3>
    ${fileLinks || '<p style="color:#6b7280;font-size:14px;">Your deliverables have been prepared — please contact us for download instructions.</p>'}

    <p style="margin:20px 0 0;font-size:12px;color:#9ca3af;">Download links expire in 7 days. If you need fresh links, contact ${escHtml(opts.agencyName)}${opts.contactEmail ? ` at <a href="mailto:${escHtml(opts.contactEmail)}" style="color:#9ca3af;">${escHtml(opts.contactEmail)}</a>` : ''}.</p>
  `;
}

/** 4. Payment Receipt — sent to customer after Stripe checkout.session.completed. */
export function buildPaymentReceiptBody(opts: {
  customerName: string;
  orderRef: string;
  amountDollars: string;
  agencyName: string;
  contactEmail: string | null;
}): string {
  return `
    <h2 style="margin:0 0 8px;font-size:22px;color:#111827;font-weight:700;">Payment confirmed ✅</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px;">Hi ${escHtml(opts.customerName)}, we've received your payment. Thank you!</p>

    <div style="background:#f0fdf4;border-radius:8px;padding:18px 20px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td style="font-size:13px;color:#6b7280;padding:5px 0;">Order</td>
          <td style="font-size:13px;font-weight:700;color:#111827;padding:5px 0;text-align:right;font-family:'Courier New',monospace;">#${escHtml(opts.orderRef)}</td>
        </tr>
        <tr>
          <td style="font-size:13px;color:#6b7280;padding:5px 0;">Amount paid</td>
          <td style="font-size:18px;font-weight:700;color:#16a34a;padding:5px 0;text-align:right;">$${escHtml(opts.amountDollars)}</td>
        </tr>
        <tr>
          <td style="font-size:13px;color:#6b7280;padding:5px 0;">Status</td>
          <td style="padding:5px 0;text-align:right;">
            <span style="background:#dcfce7;color:#15803d;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600;">Paid</span>
          </td>
        </tr>
      </table>
    </div>

    <div style="background:#eff6ff;border-left:3px solid #3b82f6;padding:13px 16px;border-radius:0 6px 6px 0;margin-bottom:20px;">
      <p style="margin:0;font-size:13px;color:#1e40af;">We're now working on your project and will be in touch when your deliverables are ready.</p>
    </div>

    <p style="margin:0;font-size:13px;color:#9ca3af;">Questions? Contact ${escHtml(opts.agencyName)}${opts.contactEmail ? ` at <a href="mailto:${escHtml(opts.contactEmail)}" style="color:#9ca3af;">${escHtml(opts.contactEmail)}</a>` : ''}.</p>
  `;
}

// Simple HTML-escape to prevent injection in email content
function escHtml(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
