import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { sendAccountStatusEmail, type AccountStatus } from '../_shared/accountStatusEmail.ts';
import {
  parseAndSizeCheck,
  checkUnknownParams,
  checkFieldLengths,
  checkChoiceParams,
  buildModerationInput,
} from '../_shared/inputValidation.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const falKey = Deno.env.get('FAL_KEY');
const resendApiKey = Deno.env.get('RESEND_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// ── fal.ai model routing ───────────────────────────────────────────────────────
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

// ── Permitted service IDs (must match src/lib/serviceCatalog.ts) ───────────────
// Any serviceType not in this set is rejected before generation begins.
const VALID_SERVICE_IDS = new Set([
  'ad-campaign', 'social-media-graphics',
  'logo-branding', 'illustrations', 'business-cards', 'packaging-design',
  'product-photography', 'product-mockups', 'amazon-a-plus', 'storefront-design',
  'listing-optimization', 'labels',
  'website-design', 'landing-pages', 'ui-ux-design', 'figma-prototypes', 'responsive-design',
  'print-design', 'brochures', 'flyers', 'banners', 'signage-design',
  'presentations', 'sales-materials', 'email-templates',
  'short-form-video', 'long-form-video', 'motion-graphics', 'video-ads', 'animated-explainers',
]);

function pickFalModel(serviceType: string, modelOverride?: string): string {
  if (modelOverride) return modelOverride;
  return SERVICE_TO_FAL_MODEL[serviceType] ?? DEFAULT_FAL_MODEL;
}

function toFalImageSize(dalleSize: string): string {
  if (dalleSize === '1024x1792') return 'portrait_16_9';
  if (dalleSize === '1792x1024') return 'landscape_16_9';
  return 'square_hd';
}

function toIdeogramAspectRatio(dalleSize: string): string {
  if (dalleSize === '1024x1792') return 'ASPECT_9_16';
  if (dalleSize === '1792x1024') return 'ASPECT_16_9';
  return 'ASPECT_1_1';
}

function extractHexColors(text: string): Array<{ r: number; g: number; b: number }> {
  const matches = text.match(/#[0-9a-fA-F]{6}/g) ?? [];
  return matches.slice(0, 3).map(hex => ({
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  }));
}

const retryWithBackoff = async (fn: () => Promise<Response>, maxRetries = 3): Promise<Response> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fn();
      if (response.ok) return response;
      if (response.status === 429) {
        const wait = Math.pow(2, i) * 1000;
        await new Promise(r => setTimeout(r, wait));
        continue;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw new Error('Max retries exceeded');
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPLIANCE — THREE LAYERS, FAIL-CLOSED
//
// Layer 1: OpenAI omni-moderation-latest
// Layer 2: Deterministic rule patterns (Tier 1 & 2, gambling bypass)
// Layer 3: LLM policy classifier (gpt-4o-mini, structured JSON verdict)
//
// Tier 1 (CSAM, NCII/deepfakes, terrorism, political deepfakes):
//   → immediate auto-suspend + high-priority alert
// Tier 2 (all other prohibited categories):
//   → block + 3-strikes auto-review flag
//
// Gray zone:
//   • Explicit counterfeit language → Tier 2 block
//   • Other brand/IP references → generate + mark pending_review
//   • Gambling on whitelist → allow + log for periodic review
// ═══════════════════════════════════════════════════════════════════════════════

// Categories that trigger instant account suspension (Tier 1)
const TIER_1_CATEGORIES = new Set([
  'csam', 'ncii', 'terrorism', 'political-deepfake',
  // OpenAI omni-moderation category names that map to Tier 1
  'sexual/minors', 'harassment/threatening', 'hate/threatening',
  'violence/graphic',  // catch-all for the most severe OpenAI categories
]);

// Deterministic rules with tier assignments
// Each rule has isGambling=true to support whitelist bypass
const CUSTOM_RULES: Array<{
  category: string;
  label: string;
  tier: 1 | 2;
  isGambling?: true;
  pattern: RegExp;
}> = [
  // ── Tier 1 ──────────────────────────────────────────────────────────────────
  {
    category: 'csam',
    label: 'CSAM or sexualizing of minors',
    tier: 1,
    pattern: /\b(csam|child\s+(?:porn(?:ography)?|sex|nude|naked|sexual|explicit)|loli(?:con)?|shota|minor[s]?\s+(?:nude|naked|sexual|porn|explicit)|sexuali[sz](?:ing|ed|ation)\s+(?:child|minor|teen)s?|kiddie\s+porn|underage\s+(?:porn|sex|nude))\b/i,
  },
  {
    category: 'ncii',
    label: 'Non-consensual intimate imagery or deepfakes of real people',
    tier: 1,
    pattern: /\b(deepfake[s]?\s+(?:nude|naked|porn|sex|intimate|undressed)|non[- ]?consensual\s+(?:nude|naked|intimate|porn|sex(?:ual)?))|revenge\s+porn|faceswap\s+(?:nude|naked|porn)|undress(?:ing|ed)?\s+(?:app|ai|tool|someone)|make\s+(?:her|him|them|someone)\s+(?:naked|nude)|nudif[yi]/i,
  },
  {
    category: 'terrorism',
    label: 'Terrorist, extremist, or hate group content',
    tier: 1,
    pattern: /\b(?:recruit(?:ing|ment)?\s+for\s+(?:isis|al[- ]?qaeda|taliban|hamas|hezbollah|boogaloo|proud\s+boys)|jihadist\s+(?:propaganda|recruitment|content)|white\s+supremac(?:y|ist)\s+(?:propaganda|recruitment|content|manifesto)|neo[- ]?nazi\s+(?:propaganda|recruitment|content)|terrorist\s+(?:attack\s+plan|manifesto|bomb\s+instructions)|glorif(?:y|ying|ication)\s+(?:genocide|terrorism|mass\s+(?:murder|shooting|killing)))\b/i,
  },
  {
    category: 'political-deepfake',
    label: 'Political deepfakes or election fraud disinformation',
    tier: 1,
    pattern: /\b(?:deepfake[s]?\s+(?:of\s+)?(?:biden|trump|harris|obama|putin|xi\s+jinping|macron|sunak|a\s+(?:president|senator|governor|candidate|politician))|fabricat(?:e|ed|ing)\s+(?:a\s+)?(?:politician|candidate|president|senator)(?:'s)?\s+(?:speech|video|audio|statement|quote)|fake\s+video\s+of\s+(?:a\s+)?(?:president|politician|candidate|senator)|election\s+fraud\s+(?:evidence|proof)|deepfake\s+(?:ballot|election|voter|vote))\b/i,
  },
  // ── Tier 2 ──────────────────────────────────────────────────────────────────
  {
    category: 'counterfeit',
    label: 'Counterfeit or IP-infringing content — explicit language',
    tier: 2,
    pattern: /\b(?:counterfeit|knock[- ]?offs?|replica\s+(?:bags?|watch(?:es)?|shoes?|sneakers?|handbags?|jewelry|designer\s+\w+)|fake\s+(?:designer|gucci|louis\s?vuitton|rolex|nike|adidas|chanel|prada|dior|hermes|supreme)|1\s?:\s?1\s+(?:replica|copy|mirror|quality)|aaa\+?\s+(?:replica|quality|grade)|mirror[- ]quality|superfake|unauthorized\s+(?:replica|merchandise|copy)|replica\s+(?:watch|bag|shoes?))\b/i,
  },
  {
    category: 'gambling',
    label: 'Unlicensed gambling services',
    tier: 2,
    isGambling: true,
    pattern: /\b(?:online\s+casino[s]?|sports?\s*bett?ing\s+(?:site|app|platform)|slot\s+machines?\s+(?:site|app|online)|poker\s+(?:site[s]?|room[s]?|app[s]?)|bett?ing\s+(?:site[s]?|app[s]?|platform[s]?|odds)|gambling\s+(?:site[s]?|app[s]?|platform[s]?)|jackpot\s+site[s]?|sweepstakes\s+casino[s]?|offshore\s+(?:casino|betting)|crypto\s+casino[s]?|unlicensed\s+(?:casino|sportsbook|betting\s+site))\b/i,
  },
  {
    category: 'securities-scam',
    label: 'Securities fraud or financial scams',
    tier: 2,
    pattern: /\b(?:pump[- ]?and[- ]?dump|guaranteed\s+(?:returns?|profits?)|double\s+your\s+(?:money|investment|crypto|bitcoin)|ponzi\s+scheme|pyramid\s+scheme|get\s+rich\s+quick\s+(?:crypto|forex|invest)|insider\s+trading\s+tips?|penny\s+stock\s+(?:alert[s]?|tip[s]?|pick[s]?)|forex\s+signal[s]?|crypto\s+pump[- ]?(?:and[- ]?dump|signal[s]?)|risk[- ]?free\s+invest(?:ment|ing)?|100%\s+(?:returns?|profits?)|1000?x\s+(?:token|coin|crypto)|presale\s+moon\s+guarantee)\b/i,
  },
  {
    category: 'sanctioned-entity',
    label: 'OFAC-sanctioned entities or jurisdictions',
    tier: 2,
    pattern: /\b(?:north\s+korea(?:n\s+(?:government|military|bank))?|dprk|iranian\s+(?:government|military|oil|bank|regime)|syrian\s+(?:government|oil|regime)|crimea(?:n\s+(?:government|bank))?|hezbollah|hamas|taliban|wagner\s+group|isis|al[- ]?qaeda|sanctions?\s+evasion|ofac\s+(?:evasion|bypass|workaround)|sanctioned\s+(?:bank|entity|country|jurisdiction))\b/i,
  },
  {
    category: 'drugs-weapons-trafficking',
    label: 'Illegal drugs, weapons, or human trafficking',
    tier: 2,
    pattern: /\b(?:cocaine\s+(?:for\s+sale|dealer|supplier)|heroin\s+(?:for\s+sale|dealer)|methamphetamine?\s+(?:for\s+sale|dealer|lab)|fentanyl\s+(?:for\s+sale|dealer|supplier)|mdma\s+(?:for\s+sale|dealer)|buy\s+(?:drugs|narcotics|cocaine|heroin|meth|fentanyl)\s+online|ghost\s+guns?|untraceable\s+(?:gun[s]?|firearm[s]?)|illegal\s+firearms?\s+(?:sale[s]?|dealer)|silencer[s]?\s+for\s+sale|suppressor[s]?\s+for\s+sale|explosives?\s+(?:for\s+sale|instructions|how\s+to\s+make)|human\s+trafficking|sex\s+trafficking|organ\s+trafficking)\b/i,
  },
  {
    category: 'disinformation',
    label: 'Coordinated disinformation or electoral interference',
    tier: 2,
    pattern: /\b(?:fabricat(?:e|ed|ing)\s+(?:news|ballot[s]?|vote[s]?|election\s+results?)|voter\s+suppression\s+(?:campaign|scheme|tactic)|coordinated\s+inauthentic\s+(?:behavior|campaign)|fake\s+ballot[s]?\s+(?:scheme|operation)|election\s+(?:interference\s+campaign|manipulation\s+operation)|disinformation\s+campaign\s+targeting\s+(?:voter[s]?|election))\b/i,
  },
];

// Lightweight brand-name detector for gray-zone pending_review
// Catches prominent brand/trademark references without explicit counterfeit language
const BRAND_REFERENCE_PATTERN = /\b(?:gucci|louis\s?vuitton|chanel|prada|hermes|rolex|nike|adidas|supreme|dior|versace|burberry|fendi|balenciaga|off[- ]?white|yeezy|jordan\s+brand|coca[- ]?cola|pepsi|apple\s+(?:logo|brand|inc)|google|microsoft|disney|netflix|mcdonald'?s|starbucks|ferrari|lamborghini|porsche|bmw\s+logo|mercedes[- ]benz\s+logo)\b/i;

// OpenAI omni-moderation screening
async function moderateWithOpenAI(
  input: string | Array<Record<string, unknown>>,
  timeoutMs = 8000,
): Promise<{ flagged: boolean; categories: string[] }> {
  if (!openAIApiKey) throw new Error('OpenAI API key not configured');
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: 'omni-moderation-latest', input }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      throw new Error(`Moderation API ${res.status}: ${errText.slice(0, 200)}`);
    }
    const data = await res.json();
    const result = data?.results?.[0];
    if (!result) throw new Error('Moderation API returned no results');
    const categories = Object.entries(result.categories ?? {})
      .filter(([, flagged]) => flagged === true)
      .map(([name]) => name);
    return { flagged: result.flagged === true, categories };
  } finally {
    clearTimeout(tid);
  }
}

// Layer 3: LLM policy classifier — catches euphemistic / multilingual evasion
// Returns structured verdict: allowed / blocked (with category+tier) / review
interface LlmVerdict {
  verdict: 'allowed' | 'blocked' | 'review';
  category: string | null;
  tier: 1 | 2 | null;
  reason: string;
}

async function classifyWithLLM(prompt: string, timeoutMs = 12000): Promise<LlmVerdict> {
  if (!openAIApiKey) throw new Error('OpenAI API key not configured');
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), timeoutMs);
  const systemPrompt = `You are a strict payment-processor compliance classifier.
Evaluate the prompt by INTENT and EFFECT — not literal wording.
Roleplay framing ("for a movie", "hypothetically", "it's fiction"), euphemisms, and multilingual content do NOT exempt content from classification.

Prohibited categories (return the exact category code):
Tier 1 (instant account suspension):
  csam              — CSAM or any sexualization of minors
  ncii              — Non-consensual intimate imagery or deepfakes of real people
  terrorism         — Hate, extremist, or terrorist recruitment/glorification
  political-deepfake — Political deepfakes or election fraud disinformation

Tier 2 (block + strike count):
  drugs-weapons-trafficking — Illegal drugs, weapons, human/organ trafficking
  counterfeit-ip            — Counterfeit goods or explicit IP-infringing content
  gambling                  — Unlicensed gambling services promotion
  securities-scam           — Pump-and-dump, unregistered securities, financial scams
  sanctioned-entity         — Content for OFAC-sanctioned persons/entities/jurisdictions
  disinformation            — Coordinated electoral interference or fake-evidence campaigns
  illegal-other             — Any other clearly illegal content

NOT a block — return verdict "review":
  brand-ip-gray-zone — Prompt references real brand names, trademarks, or real public figures
    for creative/promotional purposes WITHOUT explicit counterfeit intent
    (e.g. "create an ad inspired by Nike's aesthetic", "logo for a coffee shop similar to Starbucks")

Return ONLY valid JSON with NO markdown fences:
{"verdict":"allowed","category":null,"tier":null,"reason":"brief"}
{"verdict":"blocked","category":"csam","tier":1,"reason":"brief"}
{"verdict":"review","category":"brand-ip-gray-zone","tier":null,"reason":"brief"}`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Classify this prompt:\n\n${prompt.slice(0, 3000)}` },
        ],
        max_tokens: 120,
        temperature: 0,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`LLM classifier HTTP ${res.status}`);
    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw) as LlmVerdict;
    if (!['allowed', 'blocked', 'review'].includes(parsed.verdict)) {
      throw new Error(`Unexpected verdict: ${parsed.verdict}`);
    }
    return parsed;
  } finally {
    clearTimeout(tid);
  }
}

// deno-lint-ignore no-explicit-any
async function logViolation(supabase: any, opts: {
  userId: string;
  userEmail?: string | null;
  prompt: string;
  serviceType?: string;
  categories: string[];
  source: 'prompt' | 'image' | 'suspension' | 'rate-limit';
  tier?: 1 | 2;
  layerTriggered?: string;
  actionTaken?: string;
}): Promise<void> {
  try {
    let agencyName: string | null = null;
    const { data: agency } = await supabase
      .from('agency_settings')
      .select('agency_name')
      .eq('user_id', opts.userId)
      .maybeSingle();
    agencyName = agency?.agency_name ?? null;

    await supabase.from('moderation_logs').insert({
      user_id:          opts.userId,
      user_email:       opts.userEmail ?? null,
      agency_name:      agencyName,
      prompt:           opts.prompt.slice(0, 2000),
      service_type:     opts.serviceType ?? null,
      flagged_categories: opts.categories,
      source:           opts.source,
      action_taken:     opts.actionTaken ?? 'blocked',
      tier:             opts.tier ?? 2,
      layer_triggered:  opts.layerTriggered ?? null,
      alert_resolved:   false,
    });

    // Tier 2 and above count toward 3-strikes auto-review (not for suspension logs)
    if (opts.source !== 'suspension' && opts.source !== 'rate-limit') {
      const { data: newlyFlagged } = await supabase.rpc('increment_and_review', { uid: opts.userId });
      // Boolean return requires the 20260708180000 migration; older deployments return void.
      if (newlyFlagged === true) {
        await notifyAccountStatus(supabase, opts.userId, 'under_review', opts.categories);
      }
    }
  } catch (e) {
    console.error('[moderation] Failed to log violation:', (e as Error).message);
  }
}

// Email the user about a moderation status change. Best-effort: failures are
// logged but never block or fail the request that triggered them.
// deno-lint-ignore no-explicit-any
async function notifyAccountStatus(
  supabase: any,
  userId: string,
  status: AccountStatus,
  categories?: string[],
): Promise<void> {
  try {
    if (!resendApiKey) {
      console.warn('[moderation] RESEND_API_KEY not set — skipping status email');
      return;
    }
    const { data: userData } = await supabase.auth.admin.getUserById(userId);
    const email = userData?.user?.email;
    if (!email) return;
    const { data: prof } = await supabase
      .from('profiles').select('first_name').eq('id', userId).maybeSingle();
    const result = await sendAccountStatusEmail({
      resendApiKey,
      to: email,
      status,
      firstName: prof?.first_name ?? null,
      categories: categories ?? null,
    });
    if (!result.ok) {
      console.error('[moderation] Status email failed:', result.error);
    } else {
      console.log(`[moderation] Sent "${status}" email to user=${userId}`);
    }
  } catch (e) {
    console.error('[moderation] Status email error:', (e as Error).message);
  }
}

// Auto-suspend (Tier 1 only — called after logViolation so the log exists first)
// deno-lint-ignore no-explicit-any
async function autoSuspendUser(supabase: any, userId: string, categories?: string[]): Promise<void> {
  try {
    await supabase
      .from('profiles')
      .update({ suspended: true, under_review: false })
      .eq('id', userId);
    console.warn(`[moderation] AUTO-SUSPENDED user=${userId} (Tier 1 violation)`);
    await notifyAccountStatus(supabase, userId, 'suspended', categories);
  } catch (e) {
    console.error('[moderation] Auto-suspend failed:', (e as Error).message);
  }
}

function violationResponse(category: string, message: string, status = 400): Response {
  return new Response(
    JSON.stringify({ error: 'CONTENT_VIOLATION', category, message }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// ── fal.ai image generation ────────────────────────────────────────────────────
async function generateImageWithFal(
  prompt: string,
  model: string,
  dalleSize: string,
  brief = '',
): Promise<{ imageUrl: string; modelUsed: string }> {
  if (!falKey) throw new Error('FAL_KEY not configured');

  let requestBody: Record<string, unknown>;

  if (model === 'fal-ai/ideogram/v3') {
    requestBody = {
      prompt,
      aspect_ratio: toIdeogramAspectRatio(dalleSize),
      rendering_speed: 'STANDARD',
      magic_prompt_option: 'ON',
    };
  } else if (model === 'fal-ai/recraft-v3') {
    const brandColors = extractHexColors(brief);
    requestBody = {
      prompt,
      image_size: toFalImageSize(dalleSize),
      style: 'realistic_image',
      ...(brandColors.length > 0 ? { colors: brandColors } : {}),
    };
  } else if (model === 'fal-ai/flux/schnell') {
    requestBody = {
      prompt,
      image_size: toFalImageSize(dalleSize),
      num_inference_steps: 4,
      num_images: 1,
      enable_safety_checker: true,
    };
  } else {
    requestBody = {
      prompt,
      image_size: toFalImageSize(dalleSize),
      num_images: 1,
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 50000);

  let response: Response;
  try {
    console.log(`[fal] → model=${model} size=${dalleSize}`);
    response = await fetch(`https://fal.run/${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => response.statusText);
    throw new Error(`fal.ai ${response.status}: ${errText.slice(0, 400)}`);
  }

  const data = await response.json();

  const imageUrl: string | undefined =
    data?.images?.[0]?.url ??
    data?.image?.url ??
    data?.output?.images?.[0]?.url;

  if (!imageUrl) {
    throw new Error(`No image URL in fal.ai response (keys: ${Object.keys(data).join(', ')})`);
  }

  console.log(`[fal] ✓ model=${model} url_prefix=${imageUrl.slice(0, 60)}`);
  return { imageUrl, modelUsed: model };
}

async function generateImageWithOpenAI(
  prompt: string,
  dalleSize: string,
): Promise<{ imageUrl: string; modelUsed: string }> {
  if (!openAIApiKey) throw new Error('OpenAI API key not configured');

  // Try dall-e-3 first (returns a hosted URL); some API keys/projects don't
  // have dall-e-3 access, so fall back to gpt-image-1 (returns base64).
  try {
    const imageResponse = await retryWithBackoff(() =>
      fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt,
          n: 1,
          size: dalleSize,
          quality: 'standard',
        }),
      })
    );

    const imageData = await imageResponse.json();
    if (imageData?.data?.[0]?.url) {
      console.log('[openai] ✓ dall-e-3 image generated');
      return { imageUrl: imageData.data[0].url, modelUsed: 'dall-e-3' };
    }
    console.warn(`[openai] dall-e-3 gave no URL, trying gpt-image-1: ${JSON.stringify(imageData).slice(0, 200)}`);
  } catch (e) {
    console.warn(`[openai] dall-e-3 failed, trying gpt-image-1: ${(e as Error).message}`);
  }

  // gpt-image-1 only supports 1024x1024, 1024x1536, 1536x1024
  const gptImageSize =
    dalleSize === '1024x1792' ? '1024x1536'
    : dalleSize === '1792x1024' ? '1536x1024'
    : '1024x1024';

  const gptImageResponse = await retryWithBackoff(() =>
    fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt,
        n: 1,
        size: gptImageSize,
        quality: 'medium',
      }),
    })
  );

  const gptImageData = await gptImageResponse.json();
  const b64 = gptImageData?.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error(`No image in gpt-image-1 response: ${JSON.stringify(gptImageData).slice(0, 300)}`);
  }

  console.log('[openai] ✓ gpt-image-1 image generated');
  return { imageUrl: `data:image/png;base64,${b64}`, modelUsed: 'gpt-image-1' };
}

async function generateImage(
  prompt: string,
  serviceType: string,
  dalleSize: string,
  modelOverride: string | undefined,
  brief: string,
): Promise<{ imageUrl: string; modelUsed: string }> {
  const falModel = pickFalModel(serviceType, modelOverride);

  if (falKey) {
    try {
      return await generateImageWithFal(prompt, falModel, dalleSize, brief);
    } catch (err) {
      console.error(`[fal] Generation failed model=${falModel}, falling back to dall-e-3:`, (err as Error).message);
      return await generateImageWithOpenAI(prompt, dalleSize);
    }
  }

  console.log('[fal] FAL_KEY not set — using dall-e-3 fallback');
  return await generateImageWithOpenAI(prompt, dalleSize);
}

// ── Edge Function entry point ──────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // ── (A) Body size cap — reject oversized payloads before any processing ──────
  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Failed to read request body' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
  const sizeResult = parseAndSizeCheck(rawBody);
  if (!sizeResult.ok) {
    return new Response(
      JSON.stringify(sizeResult.err),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
  const body = sizeResult.body;

  // ── (B) Unknown-parameter check — reject anything not in the known param set ─
  const unknownErr = checkUnknownParams(body);
  if (unknownErr) {
    return new Response(
      JSON.stringify(unknownErr),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const {
    serviceType,
    description,
    userId: bodyUserId,
    generationId,
    platform,
    objective,
    tone,
    targetAudience,
    promoDetail,
    modelOverride,
  } = body as Record<string, string | undefined>;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // ── Authenticate caller from JWT — never trust body userId ────────────────
  let userId: string | undefined;
  let userEmail: string | null = null;
  {
    const authHeader = req.headers.get('Authorization') ?? '';
    const jwt = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (jwt) {
      const { data: userData, error: userErr } = await supabase.auth.getUser(jwt);
      if (!userErr && userData?.user) {
        userId = userData.user.id;
        userEmail = userData.user.email ?? null;
      }
    }
  }
  if (!userId) {
    return new Response(
      JSON.stringify({ error: 'Authentication required' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  if (bodyUserId && bodyUserId !== userId) {
    console.warn(`[auth] body userId mismatch: body=${bodyUserId} jwt=${userId}`);
    return new Response(
      JSON.stringify({ error: 'User identity mismatch' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // ── Helper: mark generation failed and return violation response ──────────
  const failGeneration = async (
    violationCategory: string,
    violationMessage: string,
    status = 400,
  ): Promise<Response> => {
    if (generationId) {
      await supabase
        .from('ai_generations')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', generationId);
    }
    return violationResponse(violationCategory, violationMessage, status);
  };

  try {
    if (!openAIApiKey) throw new Error('OpenAI API key not configured');
    if (!serviceType) throw new Error('serviceType is required');
    if (!VALID_SERVICE_IDS.has(serviceType)) {
      return new Response(
        JSON.stringify({ error: `Unsupported service type: ${serviceType}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ── (C) Free-text field length caps — hard reject, no silent truncation ────
    const lengthErr = checkFieldLengths({ description, targetAudience, promoDetail });
    if (lengthErr) {
      return new Response(
        JSON.stringify(lengthErr),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ── (D) Choice-parameter validation against service-specific allowlists ────
    const choiceErr = checkChoiceParams(serviceType, { platform, objective, tone });
    if (choiceErr) {
      return new Response(
        JSON.stringify(choiceErr),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    console.log(`[generate] serviceType=${serviceType} user=${userId} generationId=${generationId}`);

    // ── Verify generationId ownership ────────────────────────────────────────
    if (generationId) {
      const { data: genRow, error: genErr } = await supabase
        .from('ai_generations')
        .select('user_id')
        .eq('id', generationId)
        .maybeSingle();
      if (genErr || !genRow || genRow.user_id !== userId) {
        return new Response(
          JSON.stringify({ error: 'Invalid generation record' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // ════════════════════════════════════════════════════════════════════════
    // COMPLIANCE GATE — all paths run through here before any generation
    // ════════════════════════════════════════════════════════════════════════

    // (0) Per-user rate limit: 10 generations / minute (fail-closed)
    {
      let overLimit = false;
      try {
        const { data: rl, error: rlErr } = await supabase
          .rpc('check_and_increment_rate_limit', { uid: userId, max_per_minute: 10 });
        if (rlErr) throw rlErr;
        overLimit = rl === true;
      } catch (e) {
        console.error('[rate-limit] Check failed (fail-closed):', (e as Error).message);
        overLimit = true;
      }
      if (overLimit) {
        await logViolation(supabase, {
          userId, userEmail,
          prompt: '(rate-limit exceeded)',
          serviceType,
          categories: ['rate-limit'],
          source: 'rate-limit',
          tier: 2,
          layerTriggered: 'rate-limit',
          actionTaken: 'rate_limited',
        });
        return failGeneration(
          'rate-limit',
          'Too many generation requests. Please wait a moment and try again.',
          429,
        );
      }
    }

    // (1) Suspension check — fail-closed
    {
      let suspended = false;
      try {
        const { data: prof, error: profErr } = await supabase
          .from('profiles')
          .select('suspended')
          .eq('id', userId)
          .maybeSingle();
        if (profErr) throw profErr;
        suspended = prof?.suspended === true;
      } catch (e) {
        console.error('[moderation] Suspension check failed (fail-closed):', (e as Error).message);
        return failGeneration(
          'verification-unavailable',
          'We could not verify your account standing. Please try again later.',
        );
      }
      if (suspended) {
        await logViolation(supabase, {
          userId, userEmail,
          prompt: '(account suspended)',
          serviceType,
          categories: ['account-suspended'],
          source: 'suspension',
          tier: 2,
          layerTriggered: 'suspension-check',
          actionTaken: 'blocked',
        });
        return new Response(
          JSON.stringify({
            error: 'ACCOUNT_SUSPENDED',
            category: 'account-suspended',
            message: 'Your account is suspended. Content generation is unavailable. Please contact support.',
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // (2) Gambling whitelist check — fetch once, use in Layer 2
    let isGamblingWhitelisted = false;
    try {
      const { data: wl } = await supabase
        .from('gambling_whitelist')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      isGamblingWhitelisted = !!wl;
    } catch {
      // Non-fatal: if whitelist check fails, treat as NOT whitelisted (fail-closed for gambling)
      isGamblingWhitelisted = false;
    }

    // ── (E) Build complete moderation input — ALL free-text fields, labelled ───
    // Fields are already capped (step C), so no tail can escape screening.
    // Choice params (platform/objective/tone) are validated allowlist values but
    // are still included as context for the LLM classifier.
    const moderationInput = buildModerationInput({
      description, targetAudience, promoDetail, platform, objective, tone,
    });

    if (!moderationInput) {
      // No content to screen — proceed (empty prompts handled by service config later)
    }

    // Track screening result across all layers
    interface ScreeningHit {
      categories: string[];
      label: string;
      tier: 1 | 2;
      layer: string;
      actionTaken: string;
    }
    let hit: ScreeningHit | null = null;
    let pendingReview = false;
    let pendingReviewReason = '';

    if (moderationInput) {
      // ── Layers 1 + 2 run in PARALLEL — OpenAI omni-moderation is ALWAYS called ──
      // OpenAI omni-moderation-latest must run on every request regardless of custom-rule hits.
      // Both results are collected; the highest-severity hit wins.
      const [rulesSettled, openAISettled] = await Promise.allSettled([
        // Layer 2: Deterministic rules (synchronous, wrapped in a Promise for allSettled)
        Promise.resolve((() => {
          for (const rule of CUSTOM_RULES) {
            if (rule.isGambling && isGamblingWhitelisted) continue;
            if (rule.pattern.test(moderationInput)) {
              return {
                categories: [rule.category],
                label: rule.label,
                tier: rule.tier as 1 | 2,
                layer: 'rules',
                actionTaken: 'blocked',
              } satisfies ScreeningHit;
            }
          }
          return null;
        })()),
        // Layer 1: OpenAI omni-moderation (always called)
        moderateWithOpenAI(moderationInput).then(mod => {
          if (mod.flagged && mod.categories.length > 0) {
            const tier = mod.categories.some(c => TIER_1_CATEGORIES.has(c)) ? 1 : 2;
            return {
              categories: mod.categories,
              label: mod.categories[0].replace(/[/_-]/g, ' '),
              tier,
              layer: 'openai-moderation',
              actionTaken: 'blocked',
            } satisfies ScreeningHit;
          }
          return null;
        }),
      ]);

      // Collect hits from both layers
      const candidateHits: ScreeningHit[] = [];

      if (rulesSettled.status === 'fulfilled') {
        if (rulesSettled.value) candidateHits.push(rulesSettled.value);
      } else {
        console.error('[moderation] Layer 2 (rules) error (fail-closed):', (rulesSettled.reason as Error)?.message);
        candidateHits.push({ categories: ['moderation-error'], label: 'moderation-error', tier: 2, layer: 'rules', actionTaken: 'error_blocked' });
      }

      if (openAISettled.status === 'fulfilled') {
        if (openAISettled.value) candidateHits.push(openAISettled.value);
      } else {
        console.error('[moderation] Layer 1 (OpenAI moderation) error (fail-closed):', (openAISettled.reason as Error)?.message);
        candidateHits.push({ categories: ['moderation-error'], label: 'moderation-error', tier: 2, layer: 'openai-moderation', actionTaken: 'error_blocked' });
      }

      // Pick worst hit: Tier 1 > Tier 2; within same tier, prefer 'blocked' over 'error_blocked'
      if (candidateHits.length > 0) {
        candidateHits.sort((a, b) => {
          if (a.tier !== b.tier) return a.tier - b.tier; // lower tier number = more severe
          if (a.actionTaken === 'blocked' && b.actionTaken !== 'blocked') return -1;
          return 0;
        });
        hit = candidateHits[0];
        if (candidateHits.length > 1) {
          console.log(`[moderation] Multiple hits: picked tier=${hit.tier} layer=${hit.layer}; other hit tier=${candidateHits[1].tier} layer=${candidateHits[1].layer}`);
        }
      }

      // ── Layer 3: LLM policy classifier ─────────────────────────────────────
      // Runs on every prompt that cleared layers 1 & 2 (catches evasion)
      if (!hit) {
        try {
          const verdict = await classifyWithLLM(moderationInput);
          if (verdict.verdict === 'blocked' && verdict.category) {
            const tier: 1 | 2 = verdict.tier === 1 ? 1 : 2;
            hit = {
              categories: [verdict.category],
              label: verdict.reason || verdict.category,
              tier,
              layer: 'llm-classifier',
              actionTaken: 'blocked',
            };
          } else if (verdict.verdict === 'review') {
            // Gray zone — allow generation but queue for admin review
            pendingReview = true;
            pendingReviewReason = verdict.reason || verdict.category || 'brand-ip-gray-zone';
            console.log(`[moderation] GRAY-ZONE pending_review user=${userId} reason=${pendingReviewReason}`);
          }
        } catch (e) {
          console.error('[moderation] Layer 3 (LLM classifier) error (fail-closed):', (e as Error).message);
          hit = {
            categories: ['moderation-error'],
            label: 'moderation-error',
            tier: 2,
            layer: 'llm-classifier',
            actionTaken: 'error_blocked',
          };
        }
      }

      // ── Supplemental brand-pattern check (catch missed gray-zone refs) ─────
      // Only when no block and LLM didn't already mark pending_review
      if (!hit && !pendingReview && BRAND_REFERENCE_PATTERN.test(moderationInput)) {
        pendingReview = true;
        pendingReviewReason = 'brand-reference-detected';
        console.log(`[moderation] BRAND-REF pending_review user=${userId}`);
      }

      // ── Handle any block ───────────────────────────────────────────────────
      if (hit) {
        console.warn(`[moderation] BLOCKED user=${userId} tier=${hit.tier} layer=${hit.layer} categories=${hit.categories.join(',')}`);

        // Log violation first
        await logViolation(supabase, {
          userId, userEmail,
          prompt: moderationInput,
          serviceType,
          categories: hit.categories,
          source: 'prompt',
          tier: hit.tier,
          layerTriggered: hit.layer,
          actionTaken: hit.actionTaken,
        });

        // Tier 1: auto-suspend immediately
        if (hit.tier === 1) {
          await autoSuspendUser(supabase, userId, hit.categories);
        }

        const userMessage = hit.actionTaken === 'error_blocked'
          ? 'Content screening is temporarily unavailable, so this request was not processed. Please try again shortly.'
          : hit.tier === 1
            ? 'This request violates our Content Standards and your account has been suspended pending review. Contact support.'
            : `This request violates our Content Standards (${hit.label}) and was not processed.`;

        return await failGeneration(hit.label, userMessage, hit.tier === 1 ? 403 : 400);
      }

      // ── Gambling whitelist: log allowed pass-through for periodic review ───
      if (isGamblingWhitelisted && CUSTOM_RULES.find(r => r.isGambling && r.pattern.test(moderationInput))) {
        console.log(`[moderation] GAMBLING-WHITELIST pass user=${userId}`);
        try {
          await supabase.from('moderation_logs').insert({
            user_id: userId,
            user_email: userEmail,
            prompt: moderationInput.slice(0, 2000),
            service_type: serviceType,
            flagged_categories: ['gambling'],
            source: 'prompt',
            action_taken: 'allowed_whitelist',
            tier: 2,
            layer_triggered: 'rules',
            alert_resolved: true,
          });
        } catch { /* non-fatal */ }
      }
    }

    // ════════════════════════════════════════════════════════════════════════
    // GENERATION
    // ════════════════════════════════════════════════════════════════════════

    const serviceConfig: Record<string, {
      contentType: string;
      textPrompt: string | null;
      imagePrompt: string | null;
      useJsonMode?: boolean;
      imageSize?: string;
    }> = {
      'social-media-graphics': {
        contentType: 'combo',
        textPrompt: `Create engaging social media graphics copy for: ${description}. Include platform-specific text, hashtags, and engaging captions.`,
        imagePrompt: `Create vibrant, engaging social media graphics for: ${description}. Modern, eye-catching design optimised for social platforms.`
      },
      'logo-branding': {
        contentType: 'image',
        textPrompt: null,
        imagePrompt: `Create a modern, professional logo design for: ${description}. Clean, minimalist style with strong brand identity. Vector-style design with clear typography.`
      },
      'print-design': {
        contentType: 'combo',
        textPrompt: `Create print design copy and specifications for: ${description}. Include layout guidelines, text content, and design requirements.`,
        imagePrompt: `Create professional print design materials for: ${description}. High-quality, print-ready design with proper formatting.`
      },
      'illustrations': {
        contentType: 'image',
        textPrompt: null,
        imagePrompt: `Create a custom illustration for: ${description}. Professional, high-quality artwork with modern style and vibrant colours.`
      },
      'packaging-design': {
        contentType: 'image',
        textPrompt: null,
        imagePrompt: `Create professional packaging design for: ${description}. Attractive, market-ready packaging with clear branding and product information.`
      },
      'short-form-video': {
        contentType: 'text',
        textPrompt: `Create a short-form video editing concept and script for: ${description}. Include shot sequences, timing, transitions, and text overlays for platforms like TikTok and Instagram Reels.`,
        imagePrompt: null
      },
      'long-form-video': {
        contentType: 'text',
        textPrompt: `Create a comprehensive long-form video editing plan for: ${description}. Include detailed structure, chapter markers, visual elements, and production guidelines.`,
        imagePrompt: null
      },
      'motion-graphics': {
        contentType: 'text',
        textPrompt: `Create a motion graphics concept and storyboard for: ${description}. Include animation sequences, timing, visual effects, and technical specifications.`,
        imagePrompt: null
      },
      'video-ads': {
        contentType: 'text',
        textPrompt: `Create a video advertisement concept and script for: ${description}. Include storyboard, call-to-action, target audience considerations, and platform optimisation.`,
        imagePrompt: null
      },
      'animated-explainers': {
        contentType: 'text',
        textPrompt: `Create an animated explainer video concept for: ${description}. Include script, visual style guide, character descriptions, and scene breakdown.`,
        imagePrompt: null
      },
      'website-design': {
        contentType: 'combo',
        textPrompt: `Create a comprehensive website design concept for: ${description}. Include site structure, page layouts, content strategy, and user experience guidelines.`,
        imagePrompt: `Create modern website design mockups for: ${description}. Clean, professional layouts with intuitive navigation and responsive design.`
      },
      'landing-pages': {
        contentType: 'combo',
        textPrompt: `Create a high-converting landing page copy and structure for: ${description}. Include headlines, value propositions, call-to-actions, and conversion optimisation elements.`,
        imagePrompt: `Create compelling landing page design mockups for: ${description}. Focus on conversion optimisation and clear visual hierarchy.`
      },
      'ui-ux-design': {
        contentType: 'combo',
        textPrompt: `Create UI/UX design specifications for: ${description}. Include user flow, wireframes, interface guidelines, and usability considerations.`,
        imagePrompt: `Create modern UI/UX design mockups for: ${description}. Intuitive interface design with excellent user experience.`
      },
      'figma-prototypes': {
        contentType: 'combo',
        textPrompt: `Create Figma prototype specifications for: ${description}. Include interactive elements, user flows, component systems, and prototyping guidelines.`,
        imagePrompt: `Create Figma prototype designs for: ${description}. Interactive, professional prototypes with detailed components.`
      },
      'responsive-design': {
        contentType: 'combo',
        textPrompt: `Create responsive design guidelines for: ${description}. Include breakpoints, mobile-first approach, and cross-device optimisation strategies.`,
        imagePrompt: `Create responsive design mockups for: ${description}. Multi-device layouts optimised for desktop, tablet, and mobile.`
      },
      'email-templates': {
        contentType: 'text',
        textPrompt: `Create professional email template content for: ${description}. Include subject lines, engaging copy, call-to-actions, and HTML structure guidelines.`,
        imagePrompt: null
      },
      'presentations': {
        contentType: 'text',
        textPrompt: `Create a comprehensive presentation outline for: ${description}. Include slide titles, key points, speaker notes, and visual design recommendations.`,
        imagePrompt: null
      },
      'brochures': {
        contentType: 'combo',
        textPrompt: `Create brochure content and structure for: ${description}. Include compelling copy, information hierarchy, and layout specifications.`,
        imagePrompt: `Create professional brochure design for: ${description}. Clean, informative layout with excellent visual presentation.`
      },
      'flyers': {
        contentType: 'combo',
        textPrompt: `Create eye-catching flyer content for: ${description}. Include headlines, key information, call-to-actions, and design specifications.`,
        imagePrompt: `Create vibrant, attention-grabbing flyer design for: ${description}. Bold, impactful design that stands out.`
      },
      'sales-materials': {
        contentType: 'text',
        textPrompt: `Create compelling sales materials for: ${description}. Include value propositions, key benefits, objection handling, and persuasive copy.`,
        imagePrompt: null
      },
      'amazon-a-plus': {
        contentType: 'combo',
        textPrompt: `Create Amazon A+ content copy for: ${description}. Include product features, benefits, brand story, and SEO-optimised descriptions.`,
        imagePrompt: `Create Amazon A+ content graphics for: ${description}. Professional, conversion-focused visuals that highlight product benefits.`
      },
      'product-photography': {
        contentType: 'image',
        textPrompt: null,
        imagePrompt: `Create professional product photography for: ${description}. High-quality, commercial-grade image with proper lighting, clean background, and sharp detail. No text overlays.`
      },
      'storefront-design': {
        contentType: 'combo',
        textPrompt: `Create e-commerce storefront strategy for: ${description}. Include layout recommendations, product organisation, and conversion optimisation.`,
        imagePrompt: `Create attractive e-commerce storefront designs for: ${description}. Professional, conversion-focused online store layouts.`
      },
      'listing-optimization': {
        contentType: 'text',
        textPrompt: `Create optimised product listing content for: ${description}. Include SEO keywords, compelling descriptions, bullet points, and conversion elements.`,
        imagePrompt: null
      },
      'product-mockups': {
        contentType: 'image',
        textPrompt: null,
        imagePrompt: `Create realistic product mockups for: ${description}. Professional presentation in real-world contexts and usage scenarios. Photorealistic quality.`
      },
      'business-cards': {
        contentType: 'image',
        textPrompt: null,
        imagePrompt: `Create professional business card designs for: ${description}. Clean, memorable design that represents the brand effectively.`
      },
      'labels': {
        contentType: 'image',
        textPrompt: null,
        imagePrompt: `Create product label designs for: ${description}. Clear, attractive labels that meet regulatory requirements and brand standards.`
      },
      'banners': {
        contentType: 'image',
        textPrompt: null,
        imagePrompt: `Create large format banner designs for: ${description}. High-impact, readable design optimised for viewing distance.`
      },
      'signage-design': {
        contentType: 'image',
        textPrompt: null,
        imagePrompt: `Create professional signage designs for: ${description}. Clear, functional design that provides excellent visibility and information.`
      },
    };

    // ── Ad-campaign config built dynamically ───────────────────────────────────
    if (serviceType === 'ad-campaign') {
      const platformLabels: Record<string, string> = {
        'facebook-instagram': 'Facebook and Instagram',
        'google-ads': 'Google Ads',
        'tiktok': 'TikTok',
      };
      const toneDescriptions: Record<string, string> = {
        'professional': 'professional and authoritative',
        'playful': 'fun, playful, and lighthearted',
        'urgent-promo': 'urgent, promotional, and action-driving',
        'luxury': 'luxurious, premium, and aspirational',
        'bold': 'bold, direct, and high-impact',
      };
      const platformLabel = platformLabels[platform ?? ''] || platform || 'social media';
      const toneDesc = toneDescriptions[tone ?? ''] || tone || 'professional';
      const imageSize = platform === 'tiktok' ? '1024x1792' : '1024x1024';

      serviceConfig['ad-campaign'] = {
        contentType: 'combo',
        useJsonMode: true,
        imageSize,
        textPrompt: `You are an expert advertising copywriter creating a complete ${platformLabel} ad campaign package.

Campaign Brief:
- Product/Offer: ${description}
- Target Audience: ${targetAudience || 'general audience'}
- Campaign Objective: ${(objective || 'conversions').replace(/-/g, ' ')}
- Tone: ${toneDesc}
${promoDetail ? `- Promotional Detail: ${promoDetail}` : ''}

Return ONLY a valid JSON object with exactly these fields. No markdown fences, no explanations, just JSON:
{
  "headlines": ["Headline 1 max 40 chars", "Headline 2 max 40 chars", "Headline 3 max 40 chars"],
  "primaryTextShort": "Feed ad primary text, max 125 characters, engaging and on-brand",
  "primaryTextLong": "Two to three sentence version with more context about the product and offer, suitable for detailed placements.",
  "description": "Link description max 30 chars",
  "ctaButton": "Shop Now",
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
  "videoHooks": ["Short punchy video opening line 1", "Opening hook variant 2", "Opening hook variant 3"]
}

Rules: Each headline must be max 40 characters. primaryTextShort max 125 characters. description max 30 characters. ctaButton must be exactly one of: Shop Now, Learn More, Sign Up, Get Offer, Book Now. hashtags must include the # symbol.`,
        imagePrompt: `Professional ${platformLabel} advertisement visual for: ${description}. ${toneDesc} style. Commercial quality, bold colours, product-forward composition. No text, no words, no letters.${promoDetail ? ` Visually conveys: ${promoDetail}.` : ''}`,
      };
    }

    const config = serviceConfig[serviceType];
    if (!config) throw new Error(`Unsupported service type: ${serviceType}`);

    let generatedContent: string | null = null;
    let imageUrl: string | null = null;
    let imageModel: string | null = null;

    // ── Text generation ────────────────────────────────────────────────────────
    if (config.textPrompt) {
      const requestBody: Record<string, unknown> = {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a professional marketing and design assistant. Create high-quality, engaging content.' },
          { role: 'user', content: config.textPrompt }
        ],
        max_tokens: 1200,
        temperature: config.useJsonMode ? 0.8 : 0.7,
      };
      if (config.useJsonMode) {
        requestBody.response_format = { type: 'json_object' };
      }

      const textResponse = await retryWithBackoff(() =>
        fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        })
      );

      const textData = await textResponse.json();
      generatedContent = textData.choices[0].message.content;

      if (serviceType === 'ad-campaign') {
        let jsonStr = (generatedContent as string)
          .replace(/^```json?\s*/i, '')
          .replace(/```\s*$/i, '')
          .trim();
        try {
          generatedContent = JSON.stringify(JSON.parse(jsonStr));
        } catch (e) {
          console.warn('Ad campaign JSON parse warning:', e);
          generatedContent = jsonStr;
        }
      }
    }

    // ── Image generation ───────────────────────────────────────────────────────
    if (config.imagePrompt) {
      const dalleSize = config.imageSize || '1024x1024';
      const brief = [description, targetAudience, promoDetail].filter(Boolean).join(' ');
      const result = await generateImage(
        config.imagePrompt,
        serviceType,
        dalleSize,
        modelOverride,
        brief,
      );
      imageUrl = result.imageUrl;
      imageModel = result.modelUsed;

      // ── Screen generated image (fail-closed) ────────────────────────────────
      if (imageUrl) {
        let imgHit: ScreeningHit | null = null;
        try {
          const imgMod = await moderateWithOpenAI([
            { type: 'image_url', image_url: { url: imageUrl } },
          ]);
          if (imgMod.flagged && imgMod.categories.length > 0) {
            const tier = imgMod.categories.some(c => TIER_1_CATEGORIES.has(c)) ? 1 : 2;
            imgHit = {
              categories: imgMod.categories,
              label: imgMod.categories[0].replace(/[/_-]/g, ' '),
              tier,
              layer: 'image-moderation',
              actionTaken: 'blocked',
            };
          }
        } catch (e) {
          console.error('[moderation] Image moderation error (fail-closed):', (e as Error).message);
          imgHit = {
            categories: ['moderation-error'],
            label: 'moderation-error',
            tier: 2,
            layer: 'image-moderation',
            actionTaken: 'error_blocked',
          };
        }

        if (imgHit) {
          console.warn(`[moderation] BLOCKED image user=${userId} tier=${imgHit.tier} categories=${imgHit.categories.join(',')}`);
          await logViolation(supabase, {
            userId, userEmail,
            prompt: [description, targetAudience, promoDetail].filter(Boolean).join('\n') || '(image output)',
            serviceType,
            categories: imgHit.categories,
            source: 'image',
            tier: imgHit.tier,
            layerTriggered: imgHit.layer,
            actionTaken: imgHit.actionTaken,
          });
          if (imgHit.tier === 1) await autoSuspendUser(supabase, userId, imgHit.categories);
          const imgMsg = imgHit.actionTaken === 'error_blocked'
            ? 'Content screening is temporarily unavailable, so this result was withheld. Please try again shortly.'
            : imgHit.tier === 1
              ? 'The generated image violated our Content Standards and your account has been suspended.'
              : `The generated image violated our Content Standards (${imgHit.label}) and was withheld.`;
          return await failGeneration(imgHit.label, imgMsg, imgHit.tier === 1 ? 403 : 400);
        }
      }
    }

    // ── Persist results ────────────────────────────────────────────────────────
    const updatePayload: Record<string, unknown> = {
      generated_content: generatedContent,
      image_url: imageUrl,
      status: 'draft',
      updated_at: new Date().toISOString(),
    };
    if (imageModel) updatePayload.image_model = imageModel;
    if (pendingReview) {
      updatePayload.review_status = 'pending_review';
      updatePayload.review_reason = pendingReviewReason;
    }

    const { error: updateError } = await supabase
      .from('ai_generations')
      .update(updatePayload)
      .eq('id', generationId);

    if (updateError) {
      console.error('DB update error:', updateError);
      throw new Error('Failed to save generation results');
    }

    console.log(`[generate] ✓ generationId=${generationId} imageModel=${imageModel ?? 'none'} pendingReview=${pendingReview}`);

    return new Response(
      JSON.stringify({
        success: true,
        generatedContent,
        imageUrl,
        imageModel,
        contentType: config.contentType,
        pendingReview,
        pendingReviewReason: pendingReview ? pendingReviewReason : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errMsg = (error as Error).message || 'Unknown error';
    console.error('[generate] Error:', errMsg);

    if (generationId) {
      await supabase
        .from('ai_generations')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', generationId)
        .then(({ error: dbErr }: { error: unknown }) => {
          if (dbErr) console.error('Failed to mark generation as failed:', dbErr);
        });
    }

    let errorMessage = 'Failed to generate content';
    if (errMsg.includes('429') || errMsg.includes('Too Many Requests')) {
      errorMessage = 'API rate limit exceeded. Please try again in a few moments.';
    } else if (errMsg.includes('OpenAI API key not configured')) {
      errorMessage = 'OpenAI API key is not configured. Please contact support.';
    } else if (errMsg.includes('FAL_KEY')) {
      errorMessage = 'Image generation service not configured. Please contact support.';
    }

    return new Response(
      JSON.stringify({ error: errorMessage, details: errMsg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
