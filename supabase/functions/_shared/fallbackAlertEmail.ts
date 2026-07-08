// Image-fallback alert: tracks consecutive fal.ai -> OpenAI fallbacks in the
// image_fallback_alert_state singleton row and emails the admin(s) after N
// consecutive fallbacks. One alert per incident window: no re-send until
// fal.ai succeeds again (state reset) or 24h passes.

// deno-lint-ignore-file no-explicit-any

export const FALLBACK_ALERT_THRESHOLD = 3;
const REALERT_AFTER_MS = 24 * 60 * 60 * 1000; // 24h

export function classifyFalError(err: string | null): { label: string; hint: string } {
  const e = (err || '').toLowerCase();
  if (e.includes('401')) {
    return {
      label: 'Authentication error',
      hint: 'The fal.ai API key is invalid or revoked — regenerate the key in the fal.ai dashboard and update the FAL_KEY secret.',
    };
  }
  if (e.includes('403') || e.includes('exhausted') || e.includes('balance')) {
    return {
      label: 'Balance exhausted',
      hint: 'The fal.ai account is out of credit — top up the balance at fal.ai.',
    };
  }
  if (e.includes('422')) {
    return {
      label: 'Parameter error',
      hint: 'fal.ai rejected the request parameters — the model API may have changed. Check the error detail below.',
    };
  }
  if (e.includes('fal_key not configured')) {
    return {
      label: 'Key not configured',
      hint: 'FAL_KEY is not set in the edge function secrets.',
    };
  }
  return {
    label: 'Generation error',
    hint: 'fal.ai failed for another reason — see the error detail below.',
  };
}

export function buildFallbackAlertEmail(opts: {
  consecutiveCount: number;
  fallbackError: string;
}): { subject: string; html: string } {
  const { label, hint } = classifyFalError(opts.fallbackError);
  const subject = `Image quality degraded — ${opts.consecutiveCount} consecutive fal.ai fallbacks (${label})`;

  const escaped = opts.fallbackError
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>${subject}</title></head>
    <body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;">
      <div style="border-bottom:2px solid #f97316;padding-bottom:16px;margin-bottom:24px;">
        <h1 style="margin:0;font-size:20px;color:#111;">Cretivo</h1>
      </div>
      <h2 style="color:#dc2626;font-size:22px;margin:0 0 16px 0;">Image quality degraded</h2>
      <p style="margin:0 0 12px 0;">
        The last <strong>${opts.consecutiveCount}</strong> image generations fell back from
        <strong>fal.ai</strong> (primary, higher quality) to the OpenAI backup generator.
        Customers are currently receiving backup-quality images.
      </p>
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px 18px;margin:20px 0;">
        <p style="margin:0 0 6px 0;font-size:13px;color:#dc2626;font-weight:bold;">Likely cause: ${label}</p>
        <p style="margin:0 0 10px 0;font-size:14px;color:#333;">${hint}</p>
        <p style="margin:0 0 4px 0;font-size:12px;color:#666;font-weight:bold;">Last fal.ai error</p>
        <code style="display:block;font-size:12px;color:#b91c1c;background:#fff;border-radius:6px;padding:8px 10px;word-break:break-all;">${escaped}</code>
      </div>
      <p style="margin:0 0 12px 0;">
        Once the cause is fixed, generations will automatically return to fal.ai and this alert will reset.
        You can see full details in the admin dashboard.
      </p>
      <div style="margin-top:32px;padding-top:16px;border-top:1px solid #ddd;font-size:12px;color:#999;">
        <p style="margin:0;">This is an automated alert. You will not receive another email for this incident until fal.ai succeeds again or 24 hours pass.</p>
      </div>
    </body>
    </html>
  `;

  return { subject, html };
}

export function buildFallbackRecoveryEmail(opts: {
  lastFallbackError: string | null;
}): { subject: string; html: string } {
  const subject = 'Image quality recovered — fal.ai is generating again';

  const escaped = (opts.lastFallbackError || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const errorBlock = escaped
    ? `
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px 18px;margin:20px 0;">
        <p style="margin:0 0 4px 0;font-size:12px;color:#666;font-weight:bold;">Last fal.ai error before recovery</p>
        <code style="display:block;font-size:12px;color:#6b7280;background:#fff;border-radius:6px;padding:8px 10px;word-break:break-all;">${escaped}</code>
      </div>`
    : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>${subject}</title></head>
    <body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;">
      <div style="border-bottom:2px solid #f97316;padding-bottom:16px;margin-bottom:24px;">
        <h1 style="margin:0;font-size:20px;color:#111;">Cretivo</h1>
      </div>
      <h2 style="color:#16a34a;font-size:22px;margin:0 0 16px 0;">Image quality recovered</h2>
      <p style="margin:0 0 12px 0;">
        <strong>fal.ai</strong> (primary, higher quality) just completed an image generation
        successfully. Customers are receiving full-quality images again — the earlier
        degraded-quality incident is over.
      </p>
      ${errorBlock}
      <p style="margin:0 0 12px 0;">
        No action is needed. If fal.ai starts failing again, you will receive a new alert.
      </p>
      <div style="margin-top:32px;padding-top:16px;border-top:1px solid #ddd;font-size:12px;color:#999;">
        <p style="margin:0;">This is an automated all-clear notice for the earlier image quality alert.</p>
      </div>
    </body>
    </html>
  `;

  return { subject, html };
}

async function sendAdminEmail(opts: {
  supabase: any;
  resendApiKey: string;
  subject: string;
  html: string;
  logTag: string;
}): Promise<void> {
  const emails = await getAdminEmails(opts.supabase);
  if (emails.length === 0) {
    console.error(`[fallback-alert] No admin emails found — ${opts.logTag} email not sent`);
    return;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${opts.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Cretivo <onboarding@resend.dev>',
      to: emails,
      subject: opts.subject,
      html: opts.html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[fallback-alert] Resend HTTP ${res.status} (${opts.logTag}): ${body.slice(0, 300)}`);
  } else {
    console.log(`[fallback-alert] ✓ ${opts.logTag} email sent to ${emails.length} admin(s)`);
  }
}

async function getAdminEmails(supabase: any): Promise<string[]> {
  const { data: roles, error } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'admin');
  if (error || !roles?.length) {
    if (error) console.error('[fallback-alert] Failed to load admin roles:', error.message);
    return [];
  }

  const emails: string[] = [];
  for (const r of roles as Array<{ user_id: string }>) {
    try {
      const { data, error: uErr } = await supabase.auth.admin.getUserById(r.user_id);
      if (uErr) {
        console.error(`[fallback-alert] getUserById failed for ${r.user_id}:`, uErr.message);
        continue;
      }
      const email = data?.user?.email;
      if (email) emails.push(email);
    } catch (e) {
      console.error('[fallback-alert] getUserById error:', (e as Error).message);
    }
  }
  return emails;
}

// Called after every image generation. Never throws.
export async function trackImageFallback(opts: {
  supabase: any;
  resendApiKey: string | undefined;
  fallbackError: string | null;
}): Promise<void> {
  const { supabase, resendApiKey, fallbackError } = opts;
  try {
    const { data: state, error: readErr } = await supabase
      .from('image_fallback_alert_state')
      .select('consecutive_fallbacks, alerted_at, last_fallback_error')
      .eq('id', 1)
      .maybeSingle();
    if (readErr) {
      console.error('[fallback-alert] State read failed:', readErr.message);
      return;
    }

    const now = new Date();

    // fal.ai succeeded → incident over, reset counter and alert window.
    if (!fallbackError) {
      if (state && (state.consecutive_fallbacks > 0 || state.alerted_at)) {
        const wasAlerted = Boolean(state.alerted_at);
        // Conditional reset: only rows still marked with this incident's state
        // are updated, so concurrent successes can't double-send the recovery
        // email — exactly one caller sees a non-empty result for an alerted row.
        let resetQuery = supabase
          .from('image_fallback_alert_state')
          .update({
            consecutive_fallbacks: 0,
            last_fallback_error: null,
            alerted_at: null,
            updated_at: now.toISOString(),
          })
          .eq('id', 1);
        if (wasAlerted) resetQuery = resetQuery.not('alerted_at', 'is', null);
        const { data: resetRows, error: resetErr } = await resetQuery.select('id');
        if (resetErr) {
          console.error('[fallback-alert] State reset failed:', resetErr.message);
          return;
        }
        console.log('[fallback-alert] fal.ai succeeded — incident state reset');

        // An alert was active for this incident → send the all-clear email,
        // but only if we were the caller that actually cleared alerted_at.
        if (wasAlerted && resetRows && resetRows.length > 0) {
          if (!resendApiKey) {
            console.error('[fallback-alert] RESEND_API_KEY not set — cannot send recovery email');
            return;
          }
          const { subject, html } = buildFallbackRecoveryEmail({
            lastFallbackError: state.last_fallback_error ?? null,
          });
          await sendAdminEmail({ supabase, resendApiKey, subject, html, logTag: 'Recovery' });
        }
      }
      return;
    }

    // Fallback occurred → increment counter.
    const newCount = (state?.consecutive_fallbacks ?? 0) + 1;
    const alertedAt = state?.alerted_at ? new Date(state.alerted_at) : null;
    const alertWindowOpen =
      newCount >= FALLBACK_ALERT_THRESHOLD &&
      (!alertedAt || now.getTime() - alertedAt.getTime() > REALERT_AFTER_MS);

    const update: Record<string, unknown> = {
      consecutive_fallbacks: newCount,
      last_fallback_error: fallbackError,
      updated_at: now.toISOString(),
    };
    if (alertWindowOpen) update.alerted_at = now.toISOString();

    const { error: updErr } = await supabase
      .from('image_fallback_alert_state')
      .update(update)
      .eq('id', 1);
    if (updErr) {
      console.error('[fallback-alert] State update failed:', updErr.message);
      return;
    }

    console.log(`[fallback-alert] consecutive=${newCount} alerting=${alertWindowOpen}`);
    if (!alertWindowOpen) return;

    if (!resendApiKey) {
      console.error('[fallback-alert] RESEND_API_KEY not set — cannot send alert email');
      return;
    }

    const { subject, html } = buildFallbackAlertEmail({
      consecutiveCount: newCount,
      fallbackError,
    });
    await sendAdminEmail({ supabase, resendApiKey, subject, html, logTag: 'Alert' });
  } catch (e) {
    console.error('[fallback-alert] Unexpected error:', (e as Error).message);
  }
}
