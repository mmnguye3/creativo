// Single source of truth for every AI-generatable service in Cretivo.
// VALID_SERVICE_IDS is exported for edge-function validation so the
// permitted service list can never drift between UI and backend.

export type ServiceFamily = 'social-ads' | 'brand' | 'ecommerce' | 'web-ui' | 'print' | 'video';
export type ContentType  = 'text' | 'image' | 'combo';

export interface FieldOption  { value: string; label: string }

export interface ServiceField {
  id:          string;
  label:       string;
  type:        'text' | 'textarea' | 'chips' | 'toggle';
  options?:    FieldOption[];
  placeholder?: string;
  maxChars?:   number;
  required?:   boolean;
  optional?:   boolean;
}

export interface ServiceFamilyDef { id: ServiceFamily; label: string; emoji: string }

export interface ServiceDef {
  id:          string;
  label:       string;
  emoji:       string;
  family:      ServiceFamily;
  contentType: ContentType;
  falModel:    string;
  modelReason: string;
  fields:      ServiceField[];
  buildBrief:  (v: Record<string, string>) => string;
  buildEdgeParams: (v: Record<string, string>) => Record<string, string | undefined>;
}

// ─── Shared option sets ────────────────────────────────────────────────────────

const STYLE_OPTIONS: FieldOption[] = [
  { value: 'Modern',       label: 'Modern'       },
  { value: 'Minimal',      label: 'Minimal'      },
  { value: 'Bold',         label: 'Bold'         },
  { value: 'Elegant',      label: 'Elegant'      },
  { value: 'Playful',      label: 'Playful'      },
  { value: 'Professional', label: 'Professional' },
  { value: 'Luxury',       label: 'Luxury'       },
];

const COLOR_OPTIONS: FieldOption[] = [
  { value: 'Light',       label: 'Light'       },
  { value: 'Dark',        label: 'Dark'        },
  { value: 'Vibrant',     label: 'Vibrant'     },
  { value: 'Muted',       label: 'Muted'       },
  { value: 'Monochrome',  label: 'Monochrome'  },
  { value: 'Warm',        label: 'Warm'        },
  { value: 'Cool',        label: 'Cool'        },
];

const TONE_OPTIONS: FieldOption[] = [
  { value: 'Professional', label: 'Professional' },
  { value: 'Playful',      label: 'Playful'      },
  { value: 'Urgent',       label: 'Urgent'       },
  { value: 'Luxury',       label: 'Luxury'       },
  { value: 'Bold',         label: 'Bold'         },
];

const AD_PLATFORM_OPTIONS: FieldOption[] = [
  { value: 'Instagram',      label: 'Instagram'      },
  { value: 'Facebook',       label: 'Facebook'       },
  { value: 'TikTok',         label: 'TikTok'         },
  { value: 'Google Display', label: 'Google Display' },
  { value: 'Pinterest',      label: 'Pinterest'      },
  { value: 'LinkedIn',       label: 'LinkedIn'       },
  { value: 'Twitter/X',      label: 'Twitter/X'      },
  { value: 'YouTube Shorts', label: 'YT Shorts'      },
];

// ─── Shared field / brief / edge-param helpers ─────────────────────────────────

function commonFields(descPlaceholder = 'Describe what you need in detail…'): ServiceField[] {
  return [
    { id: 'brandName',   label: 'Brand / business name', type: 'text',     placeholder: 'e.g. Bloom Skincare',   maxChars: 60,  required: true },
    { id: 'description', label: 'Brief',                  type: 'textarea', placeholder: descPlaceholder,          maxChars: 280, required: true },
    { id: 'style',       label: 'Visual style',           type: 'chips',    options: STYLE_OPTIONS },
    { id: 'colorScheme', label: 'Colour palette',         type: 'chips',    options: COLOR_OPTIONS },
  ];
}

function stdBrief(prefix: string) {
  return (v: Record<string, string>) => {
    if (!v.brandName && !v.description) return 'Fill in the brief below';
    const parts: string[] = [];
    if (v.brandName)   parts.push(`for ${v.brandName}`);
    if (v.description) parts.push(v.description);
    if (v.style)       parts.push(`${v.style.toLowerCase()} aesthetic`);
    if (v.colorScheme) parts.push(`${v.colorScheme.toLowerCase()} palette`);
    return `${prefix} ${parts.join(' — ')}`;
  };
}

function stdEdgeParams(v: Record<string, string>): Record<string, string | undefined> {
  return {
    description: [
      v.brandName     && `Brand: ${v.brandName}`,
      v.description,
      v.style         && `Visual style: ${v.style}`,
      v.colorScheme   && `Colour palette: ${v.colorScheme}`,
      v.industry      && `Industry: ${v.industry}`,
      v.targetAudience && `Target audience: ${v.targetAudience}`,
      v.projectType   && `Page/screen type: ${v.projectType}`,
      v.size          && `Format/size: ${v.size}`,
      v.platform      && `Platform: ${v.platform}`,
      v.format        && `Format: ${v.format}`,
      v.tone          && `Tone: ${v.tone}`,
      v.promoDetail   && `Promo: ${v.promoDetail}`,
    ].filter(Boolean).join('. '),
  };
}

// ─── Family definitions (display order) ───────────────────────────────────────

export const SERVICE_FAMILIES: ServiceFamilyDef[] = [
  { id: 'social-ads', label: 'Social & Ads', emoji: '📢' },
  { id: 'brand',      label: 'Brand',        emoji: '✨' },
  { id: 'ecommerce',  label: 'E-commerce',   emoji: '🛒' },
  { id: 'web-ui',     label: 'Web / UI',     emoji: '🌐' },
  { id: 'print',      label: 'Print',        emoji: '🖨️' },
  { id: 'video',      label: 'Video',        emoji: '🎬' },
];

// ─── Service catalogue ─────────────────────────────────────────────────────────

export const SERVICES: ServiceDef[] = [

  // ── Social & Ads ──────────────────────────────────────────────────────────────
  {
    id: 'ad-campaign', label: 'Ad Campaign', emoji: '📢',
    family: 'social-ads', contentType: 'combo',
    falModel: 'fal-ai/ideogram/v3',
    modelReason: 'best-in-class text rendering for ad headlines',
    fields: [
      { id: 'brandName',     label: 'Brand / business name',     type: 'text',     placeholder: 'e.g. Bloom Skincare',                         maxChars: 60,  required: true  },
      { id: 'platform',      label: 'Platform',                   type: 'chips',    options: AD_PLATFORM_OPTIONS,                                               required: true  },
      { id: 'format',        label: 'Format',                     type: 'toggle',   options: [{ value: 'Graphic', label: 'Graphic' }, { value: 'Video', label: 'Video' }, { value: 'Carousel', label: 'Carousel' }] },
      { id: 'objective',     label: 'Objective',                  type: 'chips',    options: [{ value: 'Awareness', label: 'Awareness' }, { value: 'Traffic', label: 'Traffic' }, { value: 'Conversions', label: 'Conversions' }, { value: 'Engagement', label: 'Engagement' }, { value: 'App Installs', label: 'App Installs' }] },
      { id: 'tone',          label: 'Tone',                       type: 'chips',    options: TONE_OPTIONS },
      { id: 'description',   label: 'Product / service',          type: 'textarea', placeholder: 'What are you promoting? e.g. Organic skincare line for sensitive skin', maxChars: 280, required: true  },
      { id: 'targetAudience', label: 'Target audience',           type: 'text',     placeholder: 'e.g. Women 25–40 into skincare',               maxChars: 80,  optional: true  },
      { id: 'promoDetail',   label: 'Promo hook',                 type: 'text',     placeholder: 'e.g. 20% off first order · Free shipping',     maxChars: 100, optional: true  },
    ],
    buildBrief: (v) => {
      if (!v.brandName && !v.description) return 'Fill in the brief below';
      const tone  = v.tone     ? `${v.tone.toLowerCase()} `   : '';
      const fmt   = v.format   ? `${v.format.toLowerCase()} ` : '';
      const plat  = v.platform || 'social media';
      const brand = v.brandName || 'your brand';
      const desc  = v.description ? ` — ${v.description}` : '';
      const promo = v.promoDetail ? `, ${v.promoDetail}`  : '';
      return `A ${tone}${fmt}${plat} ad for ${brand}${desc}${promo}`;
    },
    buildEdgeParams: (v) => ({
      description: v.description || '',
      platform:    v.platform,
      objective:   v.objective,
      tone:        v.tone,
      targetAudience: v.targetAudience,
      promoDetail: v.promoDetail,
    }),
  },

  {
    id: 'social-media-graphics', label: 'Social Graphics', emoji: '📱',
    family: 'social-ads', contentType: 'image',
    falModel: 'fal-ai/ideogram/v3',
    modelReason: 'sharp text and vibrant layouts for social content',
    fields: [
      ...commonFields('Describe the post — theme, message, or visual concept…'),
      { id: 'platform', label: 'Platform', type: 'chips', options: [
        { value: 'Instagram', label: 'Instagram' }, { value: 'Facebook', label: 'Facebook' },
        { value: 'TikTok', label: 'TikTok' }, { value: 'Pinterest', label: 'Pinterest' },
        { value: 'LinkedIn', label: 'LinkedIn' }, { value: 'Twitter/X', label: 'Twitter/X' },
      ]},
      { id: 'format', label: 'Post format', type: 'chips', options: [
        { value: 'Post', label: 'Post' }, { value: 'Story', label: 'Story' },
        { value: 'Reel Cover', label: 'Reel Cover' }, { value: 'Banner', label: 'Banner' },
      ]},
    ],
    buildBrief: (v) => {
      if (!v.brandName && !v.description) return 'Fill in the brief below';
      const fmt  = v.format   ? `${v.format} ` : '';
      const plat = v.platform ? `for ${v.platform} ` : '';
      return `${fmt}${plat}for ${v.brandName || 'your brand'} — ${v.description || ''}`;
    },
    buildEdgeParams: stdEdgeParams,
  },

  // ── Brand ──────────────────────────────────────────────────────────────────────
  {
    id: 'logo-branding', label: 'Logo & Branding', emoji: '✨',
    family: 'brand', contentType: 'image',
    falModel: 'fal-ai/recraft-v3',
    modelReason: 'vector-quality output with precise shape and colour control',
    fields: [
      ...commonFields('Describe the brand — industry, values, personality…'),
      { id: 'industry', label: 'Industry', type: 'chips', options: [
        { value: 'Tech', label: 'Tech' }, { value: 'Food & Bev', label: 'Food & Bev' },
        { value: 'Fashion', label: 'Fashion' }, { value: 'Health', label: 'Health' },
        { value: 'Finance', label: 'Finance' }, { value: 'Beauty', label: 'Beauty' },
        { value: 'Education', label: 'Education' }, { value: 'Sports', label: 'Sports' },
      ]},
    ],
    buildBrief: stdBrief('Logo'),
    buildEdgeParams: stdEdgeParams,
  },

  {
    id: 'illustrations', label: 'Illustrations', emoji: '🎨',
    family: 'brand', contentType: 'image',
    falModel: 'fal-ai/flux-pro/v1.1',
    modelReason: 'photorealistic detail and rich imaginative compositions',
    fields: commonFields('Describe the illustration — subject, mood, setting, style references…'),
    buildBrief: stdBrief('Illustration'),
    buildEdgeParams: stdEdgeParams,
  },

  {
    id: 'business-cards', label: 'Business Cards', emoji: '💳',
    family: 'brand', contentType: 'image',
    falModel: 'fal-ai/recraft-v3',
    modelReason: 'clean print-ready layouts with precise typography',
    fields: [
      ...commonFields('Describe the card — information hierarchy, finish, and feel…'),
      { id: 'size', label: 'Orientation', type: 'toggle', options: [
        { value: 'Landscape', label: 'Landscape' }, { value: 'Portrait', label: 'Portrait' },
      ]},
    ],
    buildBrief: stdBrief('Business card'),
    buildEdgeParams: stdEdgeParams,
  },

  {
    id: 'packaging-design', label: 'Packaging Design', emoji: '📦',
    family: 'brand', contentType: 'image',
    falModel: 'fal-ai/recraft-v3',
    modelReason: 'product-ready packaging with accurate brand colours',
    fields: [
      ...commonFields('Describe the product and packaging — type, shape, key info…'),
      { id: 'size', label: 'Package type', type: 'chips', options: [
        { value: 'Box', label: 'Box' }, { value: 'Bag', label: 'Bag' },
        { value: 'Bottle', label: 'Bottle' }, { value: 'Can', label: 'Can' },
        { value: 'Pouch', label: 'Pouch' }, { value: 'Tube', label: 'Tube' },
      ]},
    ],
    buildBrief: stdBrief('Packaging'),
    buildEdgeParams: stdEdgeParams,
  },

  // ── E-commerce ─────────────────────────────────────────────────────────────────
  {
    id: 'product-photography', label: 'Product Photos', emoji: '📸',
    family: 'ecommerce', contentType: 'image',
    falModel: 'fal-ai/flux/schnell',
    modelReason: 'studio-quality product shots delivered fast',
    fields: [
      { id: 'brandName',   label: 'Product / brand name', type: 'text',     placeholder: 'e.g. Glow Serum by Bloom', maxChars: 60, required: true },
      { id: 'description', label: 'Product description',  type: 'textarea', placeholder: 'Material, shape, colours, special features…', maxChars: 280, required: true },
      { id: 'style', label: 'Shot style', type: 'chips', options: [
        { value: 'Clean white', label: 'Clean white' }, { value: 'Lifestyle', label: 'Lifestyle' },
        { value: 'Flat lay', label: 'Flat lay' }, { value: 'Dark studio', label: 'Dark studio' },
        { value: 'Outdoor', label: 'Outdoor' }, { value: 'Minimal props', label: 'Minimal props' },
      ]},
      { id: 'colorScheme', label: 'Colour palette', type: 'chips', options: COLOR_OPTIONS },
    ],
    buildBrief: stdBrief('Product photo'),
    buildEdgeParams: stdEdgeParams,
  },

  {
    id: 'product-mockups', label: 'Product Mockups', emoji: '🖼️',
    family: 'ecommerce', contentType: 'image',
    falModel: 'fal-ai/flux/schnell',
    modelReason: 'lifestyle mockups for any product, fast',
    fields: commonFields('Describe the product and how you want it shown — surface, hands, context…'),
    buildBrief: stdBrief('Product mockup'),
    buildEdgeParams: stdEdgeParams,
  },

  {
    id: 'amazon-a-plus', label: 'Amazon A+', emoji: '🛍️',
    family: 'ecommerce', contentType: 'image',
    falModel: 'fal-ai/flux/schnell',
    modelReason: 'conversion-focused imagery for marketplace listings',
    fields: commonFields('Describe the product and key selling points to highlight…'),
    buildBrief: stdBrief('Amazon A+ banner'),
    buildEdgeParams: stdEdgeParams,
  },

  {
    id: 'storefront-design', label: 'Storefront Design', emoji: '🏪',
    family: 'ecommerce', contentType: 'image',
    falModel: 'fal-ai/flux/schnell',
    modelReason: 'eye-catching digital storefronts at speed',
    fields: commonFields('Describe the store — category, vibe, hero visual ideas…'),
    buildBrief: stdBrief('Storefront'),
    buildEdgeParams: stdEdgeParams,
  },

  {
    id: 'listing-optimization', label: 'Listing Copy', emoji: '📝',
    family: 'ecommerce', contentType: 'text',
    falModel: 'text-only',
    modelReason: 'persuasive SEO copy tuned to convert on marketplaces',
    fields: [
      { id: 'brandName',   label: 'Product / brand',  type: 'text',     placeholder: 'e.g. Bloom Serum', maxChars: 60, required: true },
      { id: 'description', label: 'Product details',  type: 'textarea', placeholder: 'Key features, benefits, and target customer…', maxChars: 280, required: true },
      { id: 'platform', label: 'Marketplace', type: 'chips', options: [
        { value: 'Amazon', label: 'Amazon' }, { value: 'Etsy', label: 'Etsy' },
        { value: 'eBay', label: 'eBay' }, { value: 'Shopify', label: 'Shopify' }, { value: 'General', label: 'General' },
      ]},
    ],
    buildBrief: (v) => `Listing copy${v.platform ? ` for ${v.platform}` : ''} — ${v.brandName || ''}: ${v.description || ''}`.trim(),
    buildEdgeParams: stdEdgeParams,
  },

  {
    id: 'labels', label: 'Labels', emoji: '🏷️',
    family: 'ecommerce', contentType: 'image',
    falModel: 'fal-ai/recraft-v3',
    modelReason: 'print-ready label layouts with exact colour rendering',
    fields: [
      ...commonFields('Describe the label — product, key text, finish…'),
      { id: 'size', label: 'Label shape', type: 'chips', options: [
        { value: 'Round', label: 'Round' }, { value: 'Rectangle', label: 'Rectangle' },
        { value: 'Oval', label: 'Oval' }, { value: 'Square', label: 'Square' },
      ]},
    ],
    buildBrief: stdBrief('Label'),
    buildEdgeParams: stdEdgeParams,
  },

  // ── Web / UI ───────────────────────────────────────────────────────────────────
  {
    id: 'website-design', label: 'Website Design', emoji: '🌐',
    family: 'web-ui', contentType: 'image',
    falModel: 'fal-ai/flux-pro/v1.1',
    modelReason: 'detailed page layouts with strong visual hierarchy',
    fields: [
      ...commonFields('Describe the site — purpose, sections, key messages…'),
      { id: 'projectType', label: 'Page type', type: 'chips', options: [
        { value: 'Homepage', label: 'Homepage' }, { value: 'About', label: 'About' },
        { value: 'Services', label: 'Services' }, { value: 'Contact', label: 'Contact' },
        { value: 'Blog', label: 'Blog' }, { value: 'E-commerce', label: 'E-commerce' },
      ]},
    ],
    buildBrief: stdBrief('Website design'),
    buildEdgeParams: stdEdgeParams,
  },

  {
    id: 'landing-pages', label: 'Landing Pages', emoji: '🚀',
    family: 'web-ui', contentType: 'image',
    falModel: 'fal-ai/flux-pro/v1.1',
    modelReason: 'high-conversion landing page concepts',
    fields: [
      ...commonFields('Describe the goal — what action should visitors take?'),
      { id: 'tone', label: 'Tone', type: 'chips', options: TONE_OPTIONS },
    ],
    buildBrief: stdBrief('Landing page'),
    buildEdgeParams: stdEdgeParams,
  },

  {
    id: 'ui-ux-design', label: 'UI/UX Design', emoji: '🎛️',
    family: 'web-ui', contentType: 'image',
    falModel: 'fal-ai/flux-pro/v1.1',
    modelReason: 'crisp interface components and interaction flows',
    fields: [
      ...commonFields('Describe the interface — screens, flows, components…'),
      { id: 'projectType', label: 'Screen type', type: 'chips', options: [
        { value: 'Dashboard', label: 'Dashboard' }, { value: 'Onboarding', label: 'Onboarding' },
        { value: 'Profile', label: 'Profile' }, { value: 'Settings', label: 'Settings' },
        { value: 'Checkout', label: 'Checkout' }, { value: 'Mobile App', label: 'Mobile App' },
      ]},
    ],
    buildBrief: stdBrief('UI design'),
    buildEdgeParams: stdEdgeParams,
  },

  {
    id: 'figma-prototypes', label: 'Figma Prototypes', emoji: '🔲',
    family: 'web-ui', contentType: 'image',
    falModel: 'fal-ai/flux-pro/v1.1',
    modelReason: 'wireframe-quality prototype visuals',
    fields: commonFields('Describe the prototype — screens, interactions, user journey…'),
    buildBrief: stdBrief('Figma prototype'),
    buildEdgeParams: stdEdgeParams,
  },

  {
    id: 'responsive-design', label: 'Responsive Design', emoji: '📐',
    family: 'web-ui', contentType: 'image',
    falModel: 'fal-ai/flux-pro/v1.1',
    modelReason: 'multi-breakpoint layout concepts side-by-side',
    fields: commonFields('Describe the layout — content priority, elements, device targets…'),
    buildBrief: stdBrief('Responsive layout'),
    buildEdgeParams: stdEdgeParams,
  },

  // ── Print ──────────────────────────────────────────────────────────────────────
  {
    id: 'print-design', label: 'Print Design', emoji: '🖨️',
    family: 'print', contentType: 'image',
    falModel: 'fal-ai/ideogram/v3',
    modelReason: 'crisp typographic layouts ready for print',
    fields: [
      ...commonFields('Describe the piece — purpose, key text, visual theme…'),
      { id: 'size', label: 'Format', type: 'chips', options: [
        { value: 'A4', label: 'A4' }, { value: 'A5', label: 'A5' },
        { value: 'Letter', label: 'Letter' }, { value: 'Square', label: 'Square' },
      ]},
    ],
    buildBrief: stdBrief('Print design'),
    buildEdgeParams: stdEdgeParams,
  },

  {
    id: 'brochures', label: 'Brochures', emoji: '📄',
    family: 'print', contentType: 'image',
    falModel: 'fal-ai/ideogram/v3',
    modelReason: 'publication-quality layout and typography',
    fields: [
      ...commonFields('Describe the brochure — sections, key messages, audience…'),
      { id: 'size', label: 'Fold type', type: 'chips', options: [
        { value: 'Tri-fold', label: 'Tri-fold' }, { value: 'Bi-fold', label: 'Bi-fold' },
        { value: 'Z-fold', label: 'Z-fold' }, { value: 'Single sheet', label: 'Single' },
      ]},
    ],
    buildBrief: stdBrief('Brochure'),
    buildEdgeParams: stdEdgeParams,
  },

  {
    id: 'flyers', label: 'Flyers', emoji: '📋',
    family: 'print', contentType: 'image',
    falModel: 'fal-ai/ideogram/v3',
    modelReason: 'eye-catching event flyers with bold headlines',
    fields: commonFields('Describe the flyer — event, key info, call to action…'),
    buildBrief: stdBrief('Flyer'),
    buildEdgeParams: stdEdgeParams,
  },

  {
    id: 'banners', label: 'Banners', emoji: '🎌',
    family: 'print', contentType: 'image',
    falModel: 'fal-ai/ideogram/v3',
    modelReason: 'high-impact banners with precise text rendering',
    fields: [
      ...commonFields('Describe the banner — headline, setting, event…'),
      { id: 'size', label: 'Orientation', type: 'toggle', options: [
        { value: 'Horizontal', label: 'Horizontal' }, { value: 'Vertical', label: 'Vertical' },
      ]},
    ],
    buildBrief: stdBrief('Banner'),
    buildEdgeParams: stdEdgeParams,
  },

  {
    id: 'signage-design', label: 'Signage', emoji: '🪧',
    family: 'print', contentType: 'image',
    falModel: 'fal-ai/recraft-v3',
    modelReason: 'large-format signage with clean vector quality',
    fields: commonFields('Describe the sign — location, purpose, key message…'),
    buildBrief: stdBrief('Signage'),
    buildEdgeParams: stdEdgeParams,
  },

  {
    id: 'presentations', label: 'Presentations', emoji: '📊',
    family: 'print', contentType: 'text',
    falModel: 'text-only',
    modelReason: 'structured slide content, speaker notes, and key messages',
    fields: [
      { id: 'brandName',   label: 'Company / brand',       type: 'text',     placeholder: 'e.g. Bloom Skincare', maxChars: 60,  required: true },
      { id: 'description', label: 'Presentation brief',    type: 'textarea', placeholder: 'Topic, sections, audience, number of slides…', maxChars: 280, required: true },
      { id: 'tone',        label: 'Tone',                  type: 'chips',    options: TONE_OPTIONS },
    ],
    buildBrief: (v) => `Presentation${v.tone ? ` (${v.tone.toLowerCase()})` : ''} for ${v.brandName || 'your brand'} — ${v.description || ''}`,
    buildEdgeParams: stdEdgeParams,
  },

  {
    id: 'sales-materials', label: 'Sales Materials', emoji: '💼',
    family: 'print', contentType: 'text',
    falModel: 'text-only',
    modelReason: 'persuasive sales copy and structured pitch content',
    fields: [
      { id: 'brandName',   label: 'Company / brand',  type: 'text',     placeholder: 'e.g. Bloom Skincare', maxChars: 60,  required: true },
      { id: 'description', label: 'What to create',   type: 'textarea', placeholder: 'One-pager, proposal, pitch deck — describe the audience and goal…', maxChars: 280, required: true },
      { id: 'tone',        label: 'Tone',             type: 'chips',    options: TONE_OPTIONS },
    ],
    buildBrief: (v) => `Sales material for ${v.brandName || 'your brand'} — ${v.description || ''}`,
    buildEdgeParams: stdEdgeParams,
  },

  {
    id: 'email-templates', label: 'Email Templates', emoji: '✉️',
    family: 'print', contentType: 'text',
    falModel: 'text-only',
    modelReason: 'high open-rate subject lines, body copy, and CTAs',
    fields: [
      { id: 'brandName',   label: 'Brand / sender name', type: 'text',     placeholder: 'e.g. Bloom Skincare', maxChars: 60,  required: true },
      { id: 'description', label: 'Email goal',          type: 'textarea', placeholder: 'Welcome email, promo, follow-up — describe the goal and recipient…', maxChars: 280, required: true },
      { id: 'tone',        label: 'Tone',                type: 'chips',    options: TONE_OPTIONS },
      { id: 'promoDetail', label: 'Promo detail',        type: 'text',     placeholder: 'e.g. 20% off with code BLOOM20', maxChars: 100, optional: true },
    ],
    buildBrief: (v) => `Email for ${v.brandName || 'your brand'} — ${v.description || ''}${v.promoDetail ? ` · ${v.promoDetail}` : ''}`,
    buildEdgeParams: stdEdgeParams,
  },

  // ── Video ──────────────────────────────────────────────────────────────────────
  {
    id: 'short-form-video', label: 'Short-Form Video', emoji: '🎬',
    family: 'video', contentType: 'text',
    falModel: 'text-only',
    modelReason: 'punchy hooks and scripts for TikTok, Reels, and Shorts',
    fields: [
      { id: 'brandName',   label: 'Brand / channel',  type: 'text',     placeholder: 'e.g. Bloom Skincare', maxChars: 60,  required: true },
      { id: 'description', label: 'Video concept',    type: 'textarea', placeholder: 'Topic, key message, target audience…', maxChars: 280, required: true },
      { id: 'tone',     label: 'Tone',    type: 'chips', options: TONE_OPTIONS },
      { id: 'platform', label: 'Platform', type: 'chips', options: [
        { value: 'TikTok', label: 'TikTok' }, { value: 'Reels', label: 'Reels' }, { value: 'YouTube Shorts', label: 'Shorts' },
      ]},
    ],
    buildBrief: (v) => `Short-form video for ${v.brandName || 'your brand'} — ${v.description || ''}${v.platform ? ` · ${v.platform}` : ''}`,
    buildEdgeParams: stdEdgeParams,
  },

  {
    id: 'long-form-video', label: 'Long-Form Video', emoji: '🎥',
    family: 'video', contentType: 'text',
    falModel: 'text-only',
    modelReason: 'structured scripts and shot lists for YouTube and explainers',
    fields: [
      { id: 'brandName',   label: 'Brand / channel', type: 'text',     placeholder: 'e.g. Bloom Skincare', maxChars: 60,  required: true },
      { id: 'description', label: 'Video brief',     type: 'textarea', placeholder: 'Topic, sections, target length, call to action…', maxChars: 280, required: true },
      { id: 'tone',        label: 'Tone',            type: 'chips',    options: TONE_OPTIONS },
    ],
    buildBrief: (v) => `Long-form video for ${v.brandName || 'your brand'} — ${v.description || ''}`,
    buildEdgeParams: stdEdgeParams,
  },

  {
    id: 'motion-graphics', label: 'Motion Graphics', emoji: '🎭',
    family: 'video', contentType: 'text',
    falModel: 'text-only',
    modelReason: 'scene-by-scene storyboards with animation direction',
    fields: [
      { id: 'brandName',   label: 'Brand / project',  type: 'text',     placeholder: 'e.g. Bloom Skincare', maxChars: 60,  required: true },
      { id: 'description', label: 'Motion concept',   type: 'textarea', placeholder: 'What animates — logo, infographic, transitions, intro…', maxChars: 280, required: true },
      { id: 'style', label: 'Motion style', type: 'chips', options: [
        { value: '2D flat', label: '2D Flat' }, { value: '3D', label: '3D' },
        { value: 'Kinetic type', label: 'Kinetic type' }, { value: 'Minimalist', label: 'Minimalist' }, { value: 'Energetic', label: 'Energetic' },
      ]},
    ],
    buildBrief: (v) => `Motion graphics for ${v.brandName || 'your brand'} — ${v.description || ''}${v.style ? ` · ${v.style}` : ''}`,
    buildEdgeParams: stdEdgeParams,
  },

  {
    id: 'video-ads', label: 'Video Ads', emoji: '📹',
    family: 'video', contentType: 'text',
    falModel: 'text-only',
    modelReason: 'conversion-focused ad scripts with hooks and CTAs',
    fields: [
      { id: 'brandName',   label: 'Brand',       type: 'text',     placeholder: 'e.g. Bloom Skincare', maxChars: 60,  required: true },
      { id: 'description', label: 'Ad brief',    type: 'textarea', placeholder: 'What to promote, audience, key benefit…', maxChars: 280, required: true },
      { id: 'tone',        label: 'Tone',        type: 'chips',    options: TONE_OPTIONS },
      { id: 'promoDetail', label: 'Promo/offer', type: 'text',     placeholder: 'e.g. 20% off this week only', maxChars: 100, optional: true },
    ],
    buildBrief: (v) => `Video ad for ${v.brandName || 'your brand'} — ${v.description || ''}${v.promoDetail ? ` · ${v.promoDetail}` : ''}`,
    buildEdgeParams: stdEdgeParams,
  },

  {
    id: 'animated-explainers', label: 'Animated Explainers', emoji: '🎞️',
    family: 'video', contentType: 'text',
    falModel: 'text-only',
    modelReason: 'character-driven explainer scripts with scene breakdowns',
    fields: [
      { id: 'brandName',   label: 'Brand / product',   type: 'text',     placeholder: 'e.g. Bloom Skincare', maxChars: 60,  required: true },
      { id: 'description', label: 'What to explain',   type: 'textarea', placeholder: 'The concept, process, or product to be explained…', maxChars: 280, required: true },
      { id: 'tone',        label: 'Tone',              type: 'chips',    options: TONE_OPTIONS },
    ],
    buildBrief: (v) => `Animated explainer for ${v.brandName || 'your brand'} — ${v.description || ''}`,
    buildEdgeParams: stdEdgeParams,
  },
];

// ─── Exported helpers ──────────────────────────────────────────────────────────

export function getService(id: string): ServiceDef | undefined {
  return SERVICES.find(s => s.id === id);
}

export function getServicesByFamily(family: ServiceFamily): ServiceDef[] {
  return SERVICES.filter(s => s.family === family);
}

/** Used by the edge function to reject unknown service types */
export const VALID_SERVICE_IDS: Set<string> = new Set(SERVICES.map(s => s.id));
