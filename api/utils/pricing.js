// Simple server-side pricing controls.
// Estimate cost and optionally block/surcharge expensive models.

const DEFAULT_PLAN = process.env.PRICING_PLAN || 'free'; // free | pro | enterprise
const BLOCK_ABOVE_PLAN = (process.env.BLOCK_ABOVE_PLAN || 'false').toLowerCase() === 'true';
const SURCHARGE_PERCENT = Number(process.env.SURCHARGE_PERCENT || 0); // e.g., 25 means +25%

// Per-1k token unit prices (USD). Update as needed.
// These are illustrative defaults; override via env if desired.
const UNIT_PRICES = {
  openai: {
    'gpt-4o-mini': { in: 0.0003, out: 0.0006 },
    'gpt-4o': { in: 0.003, out: 0.006 },
  },
  anthropic: {
    'claude-3-5-sonnet': { in: 0.003, out: 0.015 },
    'claude-3-haiku': { in: 0.00025, out: 0.00125 },
  },
  gemini: {
    'gemini-1.5-pro': { in: 0.002, out: 0.002 },
    'gemini-1.5-flash': { in: 0.0004, out: 0.0004 },
  },
};

// Mark some models as "expensive" to enforce plan gating/surcharge.
const EXPENSIVE_MODELS = new Set([
  'gpt-4o',
  'claude-3-5-sonnet',
  'gemini-1.5-pro',
]);

// Per-plan allowlist
const PLAN_ALLOW = {
  free: new Set(['gpt-4o-mini', 'claude-3-haiku', 'gemini-1.5-flash']),
  pro: new Set(['gpt-4o-mini', 'gpt-4o', 'claude-3-haiku', 'claude-3-5-sonnet', 'gemini-1.5-flash', 'gemini-1.5-pro']),
  enterprise: 'all',
};

function isAllowed(plan, provider, model) {
  const allow = PLAN_ALLOW[plan] ?? PLAN_ALLOW.free;
  if (allow === 'all') return true;
  return allow.has(model);
}

function isExpensive(model) {
  return EXPENSIVE_MODELS.has(model);
}

function getUnitPrices(provider, model) {
  return UNIT_PRICES?.[provider]?.[model] || { in: 0.001, out: 0.001 };
}

// Very rough token estimate: ~4 chars ≈ 1 token
function estimateTokensFromText(text) {
  if (!text) return 0;
  const chars = String(text).length;
  return Math.max(1, Math.ceil(chars / 4));
}

function mapLengthToMaxTokens(length) {
  if (length === 'short') return 200;
  if (length === 'long') return 1200;
  return 600; // medium/default
}

function estimatePricing({ provider, model, prompt, settings }) {
  const plan = DEFAULT_PLAN;
  const unit = getUnitPrices(provider, model);
  const estimatedTokensIn = estimateTokensFromText(prompt);
  const estimatedTokensOut = mapLengthToMaxTokens(settings?.length);
  const baseCost = (estimatedTokensIn * unit.in + estimatedTokensOut * unit.out) / 1000;

  const expensive = isExpensive(model);
  const surchargePct = expensive ? SURCHARGE_PERCENT : 0;
  const surcharge = baseCost * (surchargePct / 100);
  const estimatedCharge = baseCost + surcharge;

  const blocked = BLOCK_ABOVE_PLAN && expensive && !isAllowed(plan, provider, model);

  return {
    plan,
    provider,
    model,
    unit,
    estimatedTokensIn,
    estimatedTokensOut,
    baseCost,
    surchargePercent: surchargePct,
    surcharge,
    estimatedCharge,
    blocked,
  };
}

module.exports = {
  estimatePricing,
  isAllowed,
  isExpensive,
};
