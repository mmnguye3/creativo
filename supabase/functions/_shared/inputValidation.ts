// Server-side input-validation constants and pure functions for generate-ai-content.
// Extracted into a shared module so the test script can import them without Deno serve.

// ── Body size ──────────────────────────────────────────────────────────────────
export const MAX_BODY_BYTES = 8_192; // 8 KB — well above any legitimate request

// ── Known top-level request parameters ────────────────────────────────────────
// Keys not in this set are rejected immediately (no silent ignoring of injected fields).
export const KNOWN_PARAMS = new Set([
  'serviceType',
  'description',
  'userId',
  'generationId',
  'platform',
  'objective',
  'tone',
  'targetAudience',
  'promoDetail',
  'modelOverride',
]);

// ── Free-text field length caps ────────────────────────────────────────────────
// Enforced at parse time before any processing or screening.
// Do NOT silently truncate — reject with a clear error so intent cannot be hidden.
export const FIELD_CAPS: Record<string, number> = {
  description:    300, // textarea; UI allows up to 280
  targetAudience: 300, // text; UI allows up to 80
  promoDetail:    300, // text; UI allows up to 100
};

// ── Choice-style parameter allowlists ─────────────────────────────────────────
// Only ad-campaign sends platform / objective / tone as SEPARATE request fields;
// all other services embed choices into the description string via stdEdgeParams.
// Sending these params for a different service is therefore unexpected → reject.

export const SERVICE_CHOICE_PARAMS: Record<
  string,
  Partial<Record<string, ReadonlySet<string>>>
> = {
  'ad-campaign': {
    platform: new Set([
      'Instagram', 'Facebook', 'TikTok', 'Google Display',
      'Pinterest', 'LinkedIn', 'Twitter/X', 'YouTube Shorts',
    ]),
    objective: new Set([
      'Awareness', 'Traffic', 'Conversions', 'Engagement', 'App Installs',
    ]),
    tone: new Set([
      'Professional', 'Playful', 'Urgent', 'Luxury', 'Bold',
    ]),
  },
  // All other services: no separate choice params (embedded in description).
};

// ── Pure validation helpers ────────────────────────────────────────────────────

export type ValidationError = { error: string; field?: string };

/** Returns a ValidationError if rawBody is too large or not valid JSON; body otherwise.
 *  Size is measured in UTF-8 bytes (what is actually transmitted over the wire),
 *  not in JS string length (UTF-16 code units), so multibyte characters are counted correctly. */
export function parseAndSizeCheck(
  rawBody: string,
): { ok: true; body: Record<string, unknown> } | { ok: false; err: ValidationError } {
  // TextEncoder produces UTF-8; .length gives true byte count.
  const byteLength = new TextEncoder().encode(rawBody).length;
  if (byteLength > MAX_BODY_BYTES) {
    return {
      ok: false,
      err: {
        error: `Request body exceeds the maximum allowed size (${MAX_BODY_BYTES} bytes); received ${byteLength} bytes`,
      },
    };
  }
  try {
    const body = JSON.parse(rawBody) as Record<string, unknown>;
    return { ok: true, body };
  } catch {
    return { ok: false, err: { error: 'Invalid JSON body' } };
  }
}

/** Returns a ValidationError if any body key is not in KNOWN_PARAMS. */
export function checkUnknownParams(
  body: Record<string, unknown>,
): ValidationError | null {
  for (const key of Object.keys(body)) {
    if (!KNOWN_PARAMS.has(key)) {
      return { error: `Unknown request parameter: "${key}"`, field: key };
    }
  }
  return null;
}

/** Returns a ValidationError if any free-text field exceeds its cap. */
export function checkFieldLengths(
  fields: Record<string, string | undefined>,
): ValidationError | null {
  for (const [name, cap] of Object.entries(FIELD_CAPS)) {
    const value = fields[name];
    if (value && value.length > cap) {
      return {
        error: `"${name}" exceeds the maximum allowed length of ${cap} characters (received ${value.length})`,
        field: name,
      };
    }
  }
  return null;
}

/** Returns a ValidationError if any separately-passed choice param is invalid. */
export function checkChoiceParams(
  serviceType: string,
  choices: Record<string, string | undefined>,
): ValidationError | null {
  const serviceChoices = SERVICE_CHOICE_PARAMS[serviceType] ?? {};

  for (const param of ['platform', 'objective', 'tone'] as const) {
    const value = choices[param];
    if (value === undefined || value === '') continue;

    const allowed = serviceChoices[param];
    if (!allowed) {
      return {
        error: `"${param}" is not accepted for service "${serviceType}"`,
        field: param,
      };
    }
    if (!allowed.has(value)) {
      return {
        error: `"${param}" value "${value}" is not in the allowed list for "${serviceType}". Allowed: ${[...allowed].join(', ')}`,
        field: param,
      };
    }
  }
  return null;
}

/** Build the complete moderation input string from all free-text + choice fields.
 *  Includes field labels for LLM context. Each field is guaranteed <= its cap. */
export function buildModerationInput(fields: {
  description?: string;
  targetAudience?: string;
  promoDetail?: string;
  platform?: string;
  objective?: string;
  tone?: string;
}): string {
  return [
    fields.description    && `Brief: ${fields.description}`,
    fields.targetAudience && `Target audience: ${fields.targetAudience}`,
    fields.promoDetail    && `Promo: ${fields.promoDetail}`,
    fields.platform       && `Platform: ${fields.platform}`,
    fields.objective      && `Objective: ${fields.objective}`,
    fields.tone           && `Tone: ${fields.tone}`,
  ]
    .filter(Boolean)
    .join('\n')
    .trim();
}
