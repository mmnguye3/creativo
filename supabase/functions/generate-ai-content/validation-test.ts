// Unit tests for generate-ai-content input validation.
// Run with: deno run supabase/functions/generate-ai-content/validation-test.ts
//
// No test framework dependency — plain assertions so this runs anywhere Deno is available.

import {
  MAX_BODY_BYTES,
  parseAndSizeCheck,
  checkUnknownParams,
  checkFieldLengths,
  checkChoiceParams,
  buildModerationInput,
  FIELD_CAPS,
} from '../_shared/inputValidation.ts';

let passed = 0;
let failed = 0;

function assert(label: string, condition: boolean, extra?: unknown): void {
  if (condition) {
    console.log(`  ✓  ${label}`);
    passed++;
  } else {
    console.error(`  ✗  ${label}`, extra ?? '');
    failed++;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n=== Body size cap ===');

// Over-cap body (ASCII) → rejected
const oversizeBody = JSON.stringify({ description: 'x'.repeat(MAX_BODY_BYTES + 1) });
const oversizeResult = parseAndSizeCheck(oversizeBody);
assert('ASCII body over MAX_BODY_BYTES is rejected', !oversizeResult.ok);
assert(
  'Rejection error mentions "maximum"',
  !oversizeResult.ok && oversizeResult.err.error.toLowerCase().includes('maximum'),
);

// Over-cap body using 3-byte UTF-8 characters (e.g. Chinese/emoji) — tests byte count not char count
// Each '中' is 3 UTF-8 bytes; (MAX_BODY_BYTES / 3 + 10) chars = well over 8 KB in bytes
const multibyteCount = Math.ceil(MAX_BODY_BYTES / 3) + 10;
const multibyteBody = JSON.stringify({ description: '中'.repeat(multibyteCount) });
const multibyteByteLen = new TextEncoder().encode(multibyteBody).length;
const multibyteResult = parseAndSizeCheck(multibyteBody);
assert(
  `Multibyte body (${multibyteByteLen} UTF-8 bytes) over cap is rejected`,
  !multibyteResult.ok,
);

// Multibyte body safely UNDER cap → accepted
const safeMultibyte = JSON.stringify({ description: '中'.repeat(10) });
const safeMbResult = parseAndSizeCheck(safeMultibyte);
assert('Small multibyte body within cap passes', safeMbResult.ok);

// Valid body → parsed
const validJson = JSON.stringify({ serviceType: 'ad-campaign', description: 'hello' });
const validResult = parseAndSizeCheck(validJson);
assert('Valid body within size limit is accepted', validResult.ok);

// Malformed JSON → rejected
const badJson = parseAndSizeCheck('not json');
assert('Malformed JSON is rejected', !badJson.ok);

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n=== Unknown parameters ===');

const knownOnly = { serviceType: 'ad-campaign', description: 'test', userId: 'abc' };
assert('Known params pass', checkUnknownParams(knownOnly) === null);

const withUnknown = { serviceType: 'ad-campaign', description: 'test', injectedField: 'evil' };
const unknownErr = checkUnknownParams(withUnknown);
assert('Unknown param is rejected', unknownErr !== null);
assert('Error names the unknown param', unknownErr?.error.includes('injectedField') ?? false);

const withScript = { serviceType: 'ad-campaign', '__proto__': 'x' };
const protoErr = checkUnknownParams(withScript);
assert('Prototype-pollution key (__proto__) rejected', protoErr !== null);

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n=== Free-text field length caps ===');

// Exactly at cap → passes
const atCap = checkFieldLengths({ description: 'a'.repeat(FIELD_CAPS.description) });
assert('description at exactly cap length passes', atCap === null);

// One over cap → rejected
const oneCap = checkFieldLengths({ description: 'a'.repeat(FIELD_CAPS.description + 1) });
assert('description one character over cap is rejected', oneCap !== null);
assert('Error names the field', oneCap?.field === 'description');
assert('Error mentions "maximum"', oneCap?.error.toLowerCase().includes('maximum') ?? false);

// targetAudience over cap
const taCap = checkFieldLengths({ targetAudience: 'x'.repeat(FIELD_CAPS.targetAudience + 1) });
assert('targetAudience over cap is rejected', taCap !== null);
assert('targetAudience error names the field', taCap?.field === 'targetAudience');

// promoDetail over cap
const pdCap = checkFieldLengths({ promoDetail: 'x'.repeat(FIELD_CAPS.promoDetail + 1) });
assert('promoDetail over cap is rejected', pdCap !== null);

// All fields within cap → passes
const allOk = checkFieldLengths({
  description: 'Valid description',
  targetAudience: 'Women 25-40',
  promoDetail: '20% off',
});
assert('All fields within cap passes', allOk === null);

// Undefined/empty fields → passes (optional fields)
const withUndefined = checkFieldLengths({ description: undefined, targetAudience: undefined });
assert('Undefined optional fields pass', withUndefined === null);

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n=== Choice-parameter validation ===');

// Valid ad-campaign params → pass
const validAdChoice = checkChoiceParams('ad-campaign', {
  platform: 'Instagram',
  objective: 'Awareness',
  tone: 'Professional',
});
assert('Valid ad-campaign choice params pass', validAdChoice === null);

// Invalid platform value
const badPlatform = checkChoiceParams('ad-campaign', { platform: 'Snapchat' });
assert('Unknown platform value rejected for ad-campaign', badPlatform !== null);
assert('Error names the field', badPlatform?.field === 'platform');

// Invalid objective value
const badObj = checkChoiceParams('ad-campaign', { objective: 'Fraud' });
assert('Unknown objective value rejected', badObj !== null);

// Invalid tone value
const badTone = checkChoiceParams('ad-campaign', { tone: 'Sarcastic' });
assert('Unknown tone value rejected', badTone !== null);

// Sending platform for a service that does not accept it separately
const wrongService = checkChoiceParams('logo-branding', { platform: 'Instagram' });
assert('platform rejected for service that embeds choices in description', wrongService !== null);
assert('Error names the service', wrongService?.error.includes('logo-branding') ?? false);

// Sending objective for a service that does not accept it
const wrongObj = checkChoiceParams('flyers', { objective: 'Awareness' });
assert('objective rejected for service without explicit objective param', wrongObj !== null);

// Empty / undefined choice params on any service → pass (optional)
const noChoices = checkChoiceParams('logo-branding', { platform: undefined, objective: '', tone: undefined });
assert('Empty/undefined choice params on any service pass', noChoices === null);

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n=== buildModerationInput ===');

const mi = buildModerationInput({
  description: 'organic skincare',
  targetAudience: 'Women 25-40',
  promoDetail: '20% off',
  platform: 'Instagram',
  objective: 'Awareness',
  tone: 'Professional',
});
assert('All fields included in output', [
  'organic skincare', 'Women 25-40', '20% off', 'Instagram', 'Awareness', 'Professional',
].every(v => mi.includes(v)));
assert('Field labels are included', ['Brief:', 'Target audience:', 'Promo:', 'Platform:'].every(l => mi.includes(l)));

const miPartial = buildModerationInput({ description: 'hello' });
assert('Missing optional fields are omitted cleanly', !miPartial.includes('undefined') && !miPartial.includes('null'));

const miEmpty = buildModerationInput({});
assert('Empty input produces empty string', miEmpty === '');

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n=== Valid end-to-end request simulation ===');

// Simulates a real ad-campaign request that should pass all checks
const validBody = JSON.stringify({
  serviceType: 'ad-campaign',
  userId: 'user-123',
  generationId: 'gen-456',
  description: 'Organic skincare line for sensitive skin — light formula, dermatologist tested',
  platform: 'Instagram',
  objective: 'Conversions',
  tone: 'Luxury',
  targetAudience: 'Women aged 25–45 who value natural ingredients',
  promoDetail: '30% off your first order with code GLOW30',
});

const e2eSize = parseAndSizeCheck(validBody);
assert('Valid request passes size check', e2eSize.ok);

if (e2eSize.ok) {
  assert('No unknown params', checkUnknownParams(e2eSize.body) === null);
  const e2eBody = e2eSize.body as Record<string, string | undefined>;
  assert('No field length violations', checkFieldLengths(e2eBody) === null);
  assert('No choice violations', checkChoiceParams('ad-campaign', e2eBody) === null);
  const e2eMod = buildModerationInput(e2eBody);
  assert('Moderation input is non-empty', e2eMod.length > 0);
  assert('Moderation input contains all text', ['skincare', 'Women aged', 'GLOW30', 'Instagram', 'Luxury'].every(v => e2eMod.includes(v)));
}

// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(60)}`);
console.log(`Results: ${passed} passed, ${failed} failed out of ${passed + failed} assertions`);
if (failed > 0) {
  console.error('\nSome validation tests FAILED. Fix inputValidation.ts before deploying.');
  Deno.exit(1);
} else {
  console.log('\nAll validation tests passed ✓');
}
