// Admin-only edge function: emails a user when their account status changes
// (suspended / reinstated / under_review / review_cleared).
// Invoked fire-and-forget from the AdminCompliance dashboard.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  sendAccountStatusEmail,
  VALID_STATUSES,
  type AccountStatus,
} from '../_shared/accountStatusEmail.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const resendApiKey = Deno.env.get('RESEND_API_KEY') ?? '';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'No authorization header' }, 401);

    // Verify the caller is an admin using their own JWT (RLS-compliant is_admin()).
    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await callerClient.auth.getUser(token);
    if (userError || !user) return json({ error: 'Invalid user token' }, 401);

    const { data: isAdmin, error: adminError } = await callerClient.rpc('is_admin');
    if (adminError) return json({ error: 'Failed to verify admin status' }, 500);
    if (!isAdmin) return json({ error: 'Not authorized' }, 403);

    const { userId, status } = await req.json() as { userId?: string; status?: string };
    if (!userId || typeof userId !== 'string') return json({ error: 'userId is required' }, 400);
    if (!status || !VALID_STATUSES.includes(status as AccountStatus)) {
      return json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` }, 400);
    }
    if (!resendApiKey) return json({ error: 'RESEND_API_KEY not configured' }, 500);

    // Service-role client for user lookup (email lives in auth.users).
    const admin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: userData, error: lookupError } = await admin.auth.admin.getUserById(userId);
    if (lookupError || !userData?.user?.email) {
      return json({ error: 'User not found or has no email' }, 404);
    }

    const [{ data: profile }, { data: lastLog }] = await Promise.all([
      admin.from('profiles').select('first_name').eq('id', userId).maybeSingle(),
      admin.from('moderation_logs')
        .select('flagged_categories')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const result = await sendAccountStatusEmail({
      resendApiKey,
      to: userData.user.email,
      status: status as AccountStatus,
      firstName: profile?.first_name ?? null,
      categories: (status === 'suspended' || status === 'under_review')
        ? (lastLog?.flagged_categories ?? null)
        : null,
    });

    if (!result.ok) {
      console.error('[notify-account-status] Email send failed:', result.error);
      return json({ error: 'Failed to send email' }, 502);
    }

    console.log(`[notify-account-status] Sent "${status}" email for user=${userId}`);
    return json({ success: true });
  } catch (error) {
    console.error('[notify-account-status] Error:', (error as Error).message);
    return json({ error: (error as Error).message || 'Internal error' }, 500);
  }
});
