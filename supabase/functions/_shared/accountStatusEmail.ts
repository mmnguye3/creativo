// Shared account-status email builder + sender (Resend HTTP API).
// Used by notify-account-status (admin actions) and generate-ai-content
// (auto-flag / auto-suspend) so both paths produce identical emails.

export type AccountStatus = 'suspended' | 'reinstated' | 'under_review' | 'review_cleared';

export const VALID_STATUSES: AccountStatus[] = [
  'suspended', 'reinstated', 'under_review', 'review_cleared',
];

const COPY: Record<AccountStatus, {
  subject: string;
  heading: string;
  color: string;
  intro: string;
  nextSteps: string;
}> = {
  suspended: {
    subject: 'Your account has been suspended',
    heading: 'Account Suspended',
    color: '#dc2626',
    intro: 'Your account has been suspended due to a violation of our Content Standards. While suspended, content generation and new customer orders are unavailable.',
    nextSteps: 'If you believe this was a mistake, reply to this email or contact our support team to appeal. Include any context that may help us review your case.',
  },
  reinstated: {
    subject: 'Your account has been reinstated',
    heading: 'Account Reinstated',
    color: '#16a34a',
    intro: 'Good news — your account has been reviewed and reinstated. Full access to content generation and orders has been restored.',
    nextSteps: 'Please continue to follow our Content Standards to keep your account in good standing. No further action is needed.',
  },
  under_review: {
    subject: 'Your account is under review',
    heading: 'Account Under Review',
    color: '#d97706',
    intro: 'Your account has been placed under review after repeated content policy violations. You can continue using the platform, but further violations may lead to suspension.',
    nextSteps: 'Please review our Content Standards before submitting new generation requests. If you have questions about a specific decision, reply to this email.',
  },
  review_cleared: {
    subject: 'Your account review has been cleared',
    heading: 'Review Cleared',
    color: '#16a34a',
    intro: 'The review flag on your account has been cleared. Your account is in good standing.',
    nextSteps: 'Thanks for your patience. Please continue to follow our Content Standards. No further action is needed.',
  },
};

export function buildAccountStatusEmail(
  status: AccountStatus,
  opts: { firstName?: string | null; categories?: string[] | null } = {},
): { subject: string; html: string } {
  const copy = COPY[status];
  const name = opts.firstName?.trim() || 'there';
  const cats = (opts.categories || []).filter(Boolean);
  const categoryBlock = cats.length > 0
    ? `
      <div style="background:#f8f9fa;border-radius:8px;padding:14px 18px;margin:20px 0;">
        <p style="margin:0 0 6px 0;font-size:13px;color:#666;font-weight:bold;">Policy area involved</p>
        <p style="margin:0;font-size:14px;color:#333;">${cats.map(c => c.replace(/[-_/]/g, ' ')).join(', ')}</p>
      </div>`
    : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>${copy.subject}</title></head>
    <body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;">
      <div style="border-bottom:2px solid #f97316;padding-bottom:16px;margin-bottom:24px;">
        <h1 style="margin:0;font-size:20px;color:#111;">Cretivo</h1>
      </div>
      <h2 style="color:${copy.color};font-size:22px;margin:0 0 16px 0;">${copy.heading}</h2>
      <p style="margin:0 0 12px 0;">Hi ${name},</p>
      <p style="margin:0 0 12px 0;">${copy.intro}</p>
      ${categoryBlock}
      <p style="margin:0 0 12px 0;">${copy.nextSteps}</p>
      <div style="margin-top:32px;padding-top:16px;border-top:1px solid #ddd;font-size:12px;color:#999;">
        <p style="margin:0;">This is an automated notification about your account status. If you have questions, reply to this email.</p>
      </div>
    </body>
    </html>
  `;

  return { subject: copy.subject, html };
}

export async function sendAccountStatusEmail(opts: {
  resendApiKey: string;
  to: string;
  status: AccountStatus;
  firstName?: string | null;
  categories?: string[] | null;
}): Promise<{ ok: boolean; error?: string }> {
  const { subject, html } = buildAccountStatusEmail(opts.status, {
    firstName: opts.firstName,
    categories: opts.categories,
  });

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${opts.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Cretivo <onboarding@resend.dev>',
      to: [opts.to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return { ok: false, error: `Resend HTTP ${res.status}: ${body.slice(0, 300)}` };
  }
  return { ok: true };
}
