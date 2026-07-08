import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = 'https://ukabvhdvfajudrtqnfpm.supabase.co';
const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const falKey = Deno.env.get('FAL_KEY');

// ── Service → fal model mapping ───────────────────────────────────────────────
const SERVICE_TO_FAL_MODEL: Record<string, string> = {
  'ad-campaign':           'fal-ai/ideogram/v3',
  'social-media-graphics': 'fal-ai/ideogram/v3',
  'flyers':                'fal-ai/ideogram/v3',
  'banners':               'fal-ai/ideogram/v3',
  'brochures':             'fal-ai/ideogram/v3',
  'print-design':          'fal-ai/ideogram/v3',
  'logo-branding':         'fal-ai/recraft-v3',
  'business-cards':        'fal-ai/recraft-v3',
  'packaging-design':      'fal-ai/recraft-v3',
  'labels':                'fal-ai/recraft-v3',
  'signage-design':        'fal-ai/recraft-v3',
  'product-photography':   'fal-ai/flux/schnell',
  'product-mockups':       'fal-ai/flux/schnell',
  'amazon-a-plus':         'fal-ai/flux/schnell',
  'storefront-design':     'fal-ai/flux/schnell',
  'website-design':        'fal-ai/flux-pro/v1.1',
  'landing-pages':         'fal-ai/flux-pro/v1.1',
  'ui-ux-design':          'fal-ai/flux-pro/v1.1',
  'figma-prototypes':      'fal-ai/flux-pro/v1.1',
  'responsive-design':     'fal-ai/flux-pro/v1.1',
  'illustrations':         'fal-ai/flux-pro/v1.1',
};
const DEFAULT_FAL_MODEL = 'fal-ai/flux/schnell';

// ── Image prompt templates (mirrored from generate-ai-content) ────────────────
function buildImagePrompt(serviceType: string, description: string): string | null {
  const prompts: Record<string, string> = {
    'social-media-graphics': `Create vibrant, engaging social media graphics for: ${description}. Modern, eye-catching design optimised for social platforms.`,
    'logo-branding':         `Create a modern, professional logo design for: ${description}. Clean, minimalist style with strong brand identity. Vector-style design with clear typography.`,
    'print-design':          `Create professional print design materials for: ${description}. High-quality, print-ready design with proper formatting.`,
    'illustrations':         `Create a custom illustration for: ${description}. Professional, high-quality artwork with modern style and vibrant colours.`,
    'packaging-design':      `Create professional packaging design for: ${description}. Attractive, market-ready packaging with clear branding and product information.`,
    'website-design':        `Create modern website design mockups for: ${description}. Clean, professional layouts with intuitive navigation and responsive design.`,
    'landing-pages':         `Create compelling landing page design mockups for: ${description}. Focus on conversion optimisation and clear visual hierarchy.`,
    'ui-ux-design':          `Create modern UI/UX design mockups for: ${description}. Intuitive interface design with excellent user experience.`,
    'figma-prototypes':      `Create Figma prototype designs for: ${description}. Interactive, professional prototypes with detailed components.`,
    'responsive-design':     `Create responsive design mockups for: ${description}. Multi-device layouts optimised for desktop, tablet, and mobile.`,
    'brochures':             `Create professional brochure design for: ${description}. Clean, informative layout with excellent visual presentation.`,
    'flyers':                `Create vibrant, attention-grabbing flyer design for: ${description}. Bold, impactful design that stands out.`,
    'amazon-a-plus':         `Create Amazon A+ content graphics for: ${description}. Professional, conversion-focused visuals that highlight product benefits.`,
    'product-photography':   `Create professional product photography for: ${description}. High-quality, commercial-grade image with proper lighting, clean background, and sharp detail. No text, no words, no letters.`,
    'storefront-design':     `Create attractive e-commerce storefront designs for: ${description}. Professional, conversion-focused online store layouts.`,
    'product-mockups':       `Create realistic product mockups for: ${description}. Professional presentation in real-world contexts and usage scenarios. Photorealistic quality.`,
    'business-cards':        `Create professional business card designs for: ${description}. Clean, memorable design that represents the brand effectively.`,
    'labels':                `Create product label designs for: ${description}. Clear, attractive labels that meet regulatory requirements and brand standards.`,
    'banners':               `Create large format banner designs for: ${description}. High-impact, readable design optimised for viewing distance.`,
    'signage-design':        `Create professional signage designs for: ${description}. Clear, functional design that provides excellent visibility and information.`,
    'ad-campaign':           `Professional advertisement visual for: ${description}. Commercial quality, bold colours, product-forward composition. No text, no words, no letters.`,
  };
  return prompts[serviceType] ?? null;
}

// ── fal.ai image generation ───────────────────────────────────────────────────
async function generateViaFal(
  prompt: string,
  falModel: string,
): Promise<string> {
  const isIdeogram  = falModel.includes('ideogram');
  const isRecraft   = falModel.includes('recraft');
  const isFlux      = falModel.includes('flux');

  let body: Record<string, unknown>;
  if (isIdeogram) {
    body = { prompt, aspect_ratio: 'ASPECT_1_1', rendering_speed: 'BALANCED' };
  } else if (isRecraft) {
    body = { prompt, image_size: 'square_hd', style: 'realistic_image' };
  } else if (isFlux) {
    body = { prompt, image_size: 'square_hd', num_inference_steps: 28, guidance_scale: 3.5, num_images: 1, enable_safety_checker: false };
  } else {
    body = { prompt, image_size: 'square_hd' };
  }

  const res = await fetch(`https://fal.run/${falModel}`, {
    method: 'POST',
    headers: { Authorization: `Key ${falKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`fal.ai ${res.status}: ${errText.slice(0, 200)}`);
  }
  const data = await res.json();
  const imgUrl = data?.images?.[0]?.url ?? data?.image?.url ?? null;
  if (!imgUrl) throw new Error('fal.ai returned no image URL');
  return imgUrl;
}

// ── DALL-E fallback ───────────────────────────────────────────────────────────
async function generateViaDalle(prompt: string): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${openAIApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'dall-e-3', prompt: prompt.slice(0, 4000), n: 1, size: '1024x1024', quality: 'standard', response_format: 'url' }),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`DALL-E ${res.status}: ${errText.slice(0, 200)}`);
  }
  const data = await res.json();
  const imgUrl = data?.data?.[0]?.url;
  if (!imgUrl) throw new Error('DALL-E returned no image URL');
  return imgUrl;
}

// ── OpenAI image moderation ───────────────────────────────────────────────────
async function runImageModeration(imageUrl: string): Promise<{ flagged: boolean; categories: string[] }> {
  const res = await fetch('https://api.openai.com/v1/moderations', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${openAIApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'omni-moderation-latest', input: [{ type: 'image_url', image_url: { url: imageUrl } }] }),
  });
  if (!res.ok) throw new Error(`Moderation API ${res.status}`);
  const data = await res.json();
  const result = data?.results?.[0];
  if (!result) return { flagged: false, categories: [] };
  const flaggedCats = result.flagged
    ? Object.entries(result.categories ?? {}).filter(([, v]) => v).map(([k]) => k)
    : [];
  return { flagged: result.flagged, categories: flaggedCats };
}

// ── Log admin action to moderation_logs ──────────────────────────────────────
async function logAdminAction(
  supabase: ReturnType<typeof createClient>,
  opts: {
    userId: string;
    genUserId: string;
    serviceType: string;
    prompt: string;
    action: string;
    genId: string;
    reason?: string;
  },
) {
  try {
    await supabase.from('moderation_logs').insert({
      user_id:           opts.genUserId,
      prompt:            opts.prompt?.slice(0, 2000),
      service_type:      opts.serviceType,
      flagged_categories: [`review:${opts.action}`],
      source:            'admin-review',
      action_taken:      opts.action,
      tier:              null,
      layer_triggered:   'admin',
      alert_resolved:    true,
    });
  } catch { /* non-fatal */ }
}

// ─────────────────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Admin verification ────────────────────────────────────────────────────
    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userErr } = await anonClient.auth.getUser(token);
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: isAdminResult, error: adminErr } = await anonClient.rpc('is_admin');
    if (adminErr || !isAdminResult) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Parse body ────────────────────────────────────────────────────────────
    const body = await req.json();
    const { action, generationId, rejectionReason } = body as {
      action: 'approve_and_generate' | 'regenerate' | 'release' | 'reject';
      generationId: string;
      rejectionReason?: string;
    };

    if (!action || !generationId) {
      return new Response(JSON.stringify({ error: 'action and generationId are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Service-role client for all DB writes
    const admin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // ── Fetch generation record ───────────────────────────────────────────────
    const { data: gen, error: genErr } = await admin
      .from('ai_generations')
      .select('id, user_id, service_type, description, review_status, admin_image_url, admin_image_model')
      .eq('id', generationId)
      .single();

    if (genErr || !gen) {
      return new Response(JSON.stringify({ error: 'Generation not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Only operate on items that are in the review queue
    if (!['pending_review'].includes(gen.review_status ?? '') &&
        !(['release', 'regenerate'].includes(action))) {
      // Allow release/regenerate even if already in a transitional state
    }

    const now = new Date().toISOString();

    // ════════════════════════════════════════════════════════════════════════
    // ACTION: approve_and_generate  OR  regenerate
    // ════════════════════════════════════════════════════════════════════════
    if (action === 'approve_and_generate' || action === 'regenerate') {
      const imagePrompt = buildImagePrompt(gen.service_type, gen.description ?? '');
      if (!imagePrompt) {
        return new Response(JSON.stringify({ error: `Service type "${gen.service_type}" does not produce images` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const falModel = SERVICE_TO_FAL_MODEL[gen.service_type] ?? DEFAULT_FAL_MODEL;
      let adminImageUrl: string;
      let adminImageModel: string;

      // ── Generate image ────────────────────────────────────────────────────
      try {
        if (falKey) {
          adminImageUrl  = await generateViaFal(imagePrompt, falModel);
          adminImageModel = falModel;
        } else {
          throw new Error('FAL_KEY not configured');
        }
      } catch (falErr) {
        console.warn(`[admin-review] fal.ai failed: ${(falErr as Error).message} — falling back to DALL-E`);
        if (!openAIApiKey) throw new Error('Neither fal.ai nor OpenAI API key is configured');
        adminImageUrl  = await generateViaDalle(imagePrompt);
        adminImageModel = 'dall-e-3';
      }

      // ── Output safety screen (always runs — cannot be bypassed) ──────────
      const { flagged, categories } = await runImageModeration(adminImageUrl);

      if (flagged) {
        console.warn(`[admin-review] Output image flagged by safety screen: ${categories.join(', ')}`);
        // Do NOT persist flagged image; return warning so admin can reject
        return new Response(
          JSON.stringify({
            success: false,
            safetyFlagged: true,
            safetyCategories: categories,
            message: `The generated image was flagged by the output safety screen (${categories.join(', ')}) and has been withheld. Please reject this request.`,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      // ── Persist admin-held image ──────────────────────────────────────────
      const { error: updErr } = await admin
        .from('ai_generations')
        .update({
          admin_image_url:      adminImageUrl,
          admin_image_model:    adminImageModel,
          admin_generated_at:   now,
          admin_generated_by:   user.id,
          updated_at:           now,
        })
        .eq('id', generationId);

      if (updErr) throw new Error(`DB update failed: ${updErr.message}`);

      console.log(`[admin-review] ${action} ✓ genId=${generationId} model=${adminImageModel}`);

      return new Response(
        JSON.stringify({ success: true, adminImageUrl, adminImageModel }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ════════════════════════════════════════════════════════════════════════
    // ACTION: release
    // ════════════════════════════════════════════════════════════════════════
    if (action === 'release') {
      if (!gen.admin_image_url) {
        return new Response(JSON.stringify({ error: 'No admin-generated image to release. Run "Approve & Generate" first.' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error: updErr } = await admin
        .from('ai_generations')
        .update({
          image_url:      gen.admin_image_url,
          image_model:    gen.admin_image_model ?? null,
          status:         'completed',
          review_status:  'approved',
          reviewed_at:    now,
          reviewed_by:    user.id,
          released_at:    now,
          released_by:    user.id,
          updated_at:     now,
        })
        .eq('id', generationId);

      if (updErr) throw new Error(`DB update failed: ${updErr.message}`);

      await logAdminAction(admin, {
        userId:      user.id,
        genUserId:   gen.user_id,
        serviceType: gen.service_type,
        prompt:      gen.description ?? '',
        action:      'admin_released',
        genId:       generationId,
      });

      console.log(`[admin-review] RELEASED genId=${generationId}`);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ════════════════════════════════════════════════════════════════════════
    // ACTION: reject
    // ════════════════════════════════════════════════════════════════════════
    if (action === 'reject') {
      const { error: updErr } = await admin
        .from('ai_generations')
        .update({
          review_status:    'rejected',
          rejection_reason: rejectionReason?.trim() || 'Content did not meet our standards.',
          reviewed_at:      now,
          reviewed_by:      user.id,
          admin_image_url:  null,
          updated_at:       now,
        })
        .eq('id', generationId);

      if (updErr) throw new Error(`DB update failed: ${updErr.message}`);

      await logAdminAction(admin, {
        userId:      user.id,
        genUserId:   gen.user_id,
        serviceType: gen.service_type,
        prompt:      gen.description ?? '',
        action:      'admin_rejected',
        genId:       generationId,
        reason:      rejectionReason,
      });

      console.log(`[admin-review] REJECTED genId=${generationId} reason=${rejectionReason}`);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: unknown) {
    const msg = (err as Error).message || 'Unknown error';
    console.error('[admin-review-action] Error:', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
