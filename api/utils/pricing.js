// Very simple price table (USD per 1k tokens). Adjust as needed.
const PRICE_PER_KTOK = {
  openai: {
    'gpt-4o-mini': { in: 0.15, out: 0.60 },
    'gpt-4o':      { in: 5.00,  out: 15.00 }
  },
  anthropic: {
    'claude-3.5-sonnet': { in: 3.00, out: 15.00 },
    'claude-3-haiku':    { in: 0.25, out: 1.25 }
  },
  gemini: {
    'gemini-1.5-pro':   { in: 3.50, out: 10.50 },
    'gemini-1.5-flash': { in: 0.35, out: 1.05 }
  }
};

// Optional margin multipliers per plan (so you can "charge more" for expensive models)
const PLAN_MULTIPLIER = {
  free: 1.0,       // not actually charged; used for estimation/gating
  pro:  1.25,      // 25% margin
  enterprise: 1.5  // 50% margin
};

// quick & dirty token estimate: ~4 chars/token
function estimateTokensFromText(t) {
  if (!t) return 0;
  return Math.ceil(t.length / 4);
}

// choose nearest known model for pricing if exact not present
function lookupPricing(provider, model) {
  const table = PRICE_PER_KTOK[provider] || {};
  if (table[model]) return table[model];
  // fallbacks
  if (provider === 'openai') return table['gpt-4o-mini'] || { in: 0.2, out: 0.6 };
  if (provider === 'anthropic') return table['claude-3.5-sonnet'] || { in: 3, out: 15 };
  if (provider === 'gemini') return table['gemini-1.5-pro'] || { in: 3.5, out: 10.5 };
  return { in: 1, out: 3 };
}

export function estimateAndPrice({ provider, model, prompt, outputText, plan = 'free' }) {
  const pricing = lookupPricing(provider, model);
  const inTok = estimateTokensFromText(prompt || '');
  const outTok = estimateTokensFromText(outputText || '');
  const inputCost  = (inTok / 1000) * pricing.in;
  const outputCost = (outTok / 1000) * pricing.out;

  const baseCost = inputCost + outputCost;
  const multiplier = PLAN_MULTIPLIER[plan] ?? 1.0;
  const estimatedCharge = baseCost * multiplier;

  return {
    model,
    provider,
    inTokens: inTok,
    outTokens: outTok,
    pricingPerK: pricing,
    plan,
    multiplier,
    estimatedCharge
  };
}
