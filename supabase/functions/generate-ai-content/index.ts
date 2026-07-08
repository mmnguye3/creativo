import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const falKey = Deno.env.get('FAL_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// ── fal.ai model routing ───────────────────────────────────────────────────────
//
// Decision table:
//   Text-in-image (ads, promos, social w/ headlines) → Ideogram v3  (best text rendering)
//   Brand / design-system assets (logos, packaging)  → Recraft V3   (brand colour controls)
//   Product photography / UGC creatives              → FLUX Schnell (fast & cheap for volume)
//   Photorealistic hero / web-design visuals         → FLUX Pro 1.1 (highest photorealism)
// ────────────────────────────────────────────────────────────────────────────────
const SERVICE_TO_FAL_MODEL: Record<string, string> = {
  // Ideogram v3 — text rendering in image
  'ad-campaign':           'fal-ai/ideogram/v3',
  'social-media-graphics': 'fal-ai/ideogram/v3',
  'flyers':                'fal-ai/ideogram/v3',
  'banners':               'fal-ai/ideogram/v3',
  'brochures':             'fal-ai/ideogram/v3',
  'print-design':          'fal-ai/ideogram/v3',
  // Recraft V3 — brand colour support
  'logo-branding':         'fal-ai/recraft-v3',
  'business-cards':        'fal-ai/recraft-v3',
  'packaging-design':      'fal-ai/recraft-v3',
  'labels':                'fal-ai/recraft-v3',
  'signage-design':        'fal-ai/recraft-v3',
  // FLUX Schnell — fast / volume (product & UGC)
  'product-photography':   'fal-ai/flux/schnell',
  'product-mockups':       'fal-ai/flux/schnell',
  'amazon-a-plus':         'fal-ai/flux/schnell',
  'storefront-design':     'fal-ai/flux/schnell',
  // FLUX Pro 1.1 — photorealistic / web visuals
  'website-design':        'fal-ai/flux-pro/v1.1',
  'landing-pages':         'fal-ai/flux-pro/v1.1',
  'ui-ux-design':          'fal-ai/flux-pro/v1.1',
  'figma-prototypes':      'fal-ai/flux-pro/v1.1',
  'responsive-design':     'fal-ai/flux-pro/v1.1',
  'illustrations':         'fal-ai/flux-pro/v1.1',
};

const DEFAULT_FAL_MODEL = 'fal-ai/flux/schnell';

function pickFalModel(serviceType: string, modelOverride?: string): string {
  if (modelOverride) return modelOverride;
  return SERVICE_TO_FAL_MODEL[serviceType] ?? DEFAULT_FAL_MODEL;
}

// ── Size conversion helpers ────────────────────────────────────────────────────
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

// ── Extract hex brand colours from brief text ──────────────────────────────────
function extractHexColors(text: string): Array<{ r: number; g: number; b: number }> {
  const matches = text.match(/#[0-9a-fA-F]{6}/g) ?? [];
  return matches.slice(0, 3).map(hex => ({
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  }));
}

// ── Retry helper ───────────────────────────────────────────────────────────────
const retryWithBackoff = async (fn: () => Promise<Response>, maxRetries = 3): Promise<Response> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fn();
      if (response.ok) return response;
      if (response.status === 429) {
        const wait = Math.pow(2, i) * 1000;
        console.log(`Rate limited, waiting ${wait}ms before retry ${i + 1}`);
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
    // FLUX Pro and other models
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

  // Normalise across model response shapes
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

// ── OpenAI DALL·E 3 image generation (fallback) ────────────────────────────────
async function generateImageWithOpenAI(
  prompt: string,
  dalleSize: string,
): Promise<{ imageUrl: string; modelUsed: string }> {
  if (!openAIApiKey) throw new Error('OpenAI API key not configured');

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

  if (!imageData?.data?.[0]?.url) {
    throw new Error(`No image URL in OpenAI response: ${JSON.stringify(imageData).slice(0, 300)}`);
  }

  console.log('[openai] ✓ dall-e-3 image generated');
  return { imageUrl: imageData.data[0].url, modelUsed: 'dall-e-3' };
}

// ── Unified image generation with fal → OpenAI fallback ───────────────────────
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

  // Parse body once and save so the error handler can reference generationId
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const {
    serviceType,
    description,
    userId,
    generationId,
    platform,
    objective,
    tone,
    targetAudience,
    promoDetail,
    modelOverride,   // optional: force a specific fal model
  } = body as Record<string, string | undefined>;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    if (!openAIApiKey) throw new Error('OpenAI API key not configured');
    if (!serviceType) throw new Error('serviceType is required');

    console.log(`[generate] serviceType=${serviceType} user=${userId} generationId=${generationId}`);

    // ── Service config (text + image prompts) ──────────────────────────────────
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
      }
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

    // ── Text generation (always OpenAI) ───────────────────────────────────────
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

    // ── Image generation (fal.ai with OpenAI fallback) ─────────────────────────
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
    }

    // ── Persist results ────────────────────────────────────────────────────────
    const updatePayload: Record<string, unknown> = {
      generated_content: generatedContent,
      image_url: imageUrl,
      status: 'draft',
      updated_at: new Date().toISOString(),
    };
    if (imageModel) updatePayload.image_model = imageModel;

    const { error: updateError } = await supabase
      .from('ai_generations')
      .update(updatePayload)
      .eq('id', generationId);

    if (updateError) {
      console.error('DB update error:', updateError);
      throw new Error('Failed to save generation results');
    }

    console.log(`[generate] ✓ generationId=${generationId} imageModel=${imageModel ?? 'none'}`);

    return new Response(
      JSON.stringify({
        success: true,
        generatedContent,
        imageUrl,
        imageModel,
        contentType: config.contentType,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errMsg = (error as Error).message || 'Unknown error';
    console.error('[generate] Error:', errMsg);

    // Mark the row as failed (generationId is in scope from the parsed body)
    if (generationId) {
      await supabase
        .from('ai_generations')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', generationId)
        .then(({ error: dbErr }) => {
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
