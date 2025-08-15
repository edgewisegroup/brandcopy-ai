import { callOpenAI } from './providers/openai.js';
import { callAnthropic } from './providers/anthropic.js';
import { callGemini } from './providers/gemini.js';
import { normalize } from './utils/normalize.js';
import { estimateAndPrice } from './utils/pricing.js';

export default async function handler(req, res) {
  // Minimal CORS support (allow calling from other origins)
  setCORS(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { provider, model, prompt, settings } = req.body || {};
    if (!provider || !model || !prompt) {
      return res.status(400).json({ error: 'provider, model, prompt required' });
    }

    // Simple allowlist / plan gating
    const plan = (req.headers['x-plan'] || 'free').toString(); // free | pro | enterprise
    const { allowed, reason } = checkAllowed(provider, model, plan);
    if (!allowed) return res.status(402).json({ error: `Blocked by plan policy: ${reason}` });

    let raw, usageLike = {};
    if (provider === 'openai') raw = await callOpenAI({ model, prompt, settings });
    else if (provider === 'anthropic') raw = await callAnthropic({ model, prompt, settings });
    else if (provider === 'gemini') raw = await callGemini({ model, prompt, settings });
  else return res.status(400).json({ error: 'Unsupported provider' });

    const result = normalize(raw, provider);
    // Best-effort usage mapping (some providers vary):
    usageLike = result.usage || {};
    const pricing = estimateAndPrice({ provider, model, prompt, outputText: result.text, plan });

    return res.status(200).json({
      provider, model, text: result.text, usage: usageLike, pricing
    });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Unknown error' });
  }
}

function checkAllowed(provider, model, plan) {
  // Example: block very expensive models for free plan
  const expensive = (
    (provider === 'openai' && /gpt-4o|gpt-4-turbo/i.test(model)) ||
    (provider === 'anthropic' && /opus|sonnet/i.test(model)) ||
    (provider === 'gemini' && /1\.5-pro|flash-1\.5-pro/i.test(model))
  );
  if (plan === 'free' && expensive) {
    return { allowed: false, reason: `Upgrade required for model ${model}` };
  }
  return { allowed: true };
}

function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Plan');
}
