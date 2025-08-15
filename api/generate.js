import { normalize } from "../utils/normalize";
import { callOpenAI } from "../providers/openai";
import { callAnthropic } from "../providers/anthropic";
import { callGemini } from "../providers/gemini";
import { estimatePricing, isAllowed } from "../utils/pricing";

export const config = { runtime: "nodejs" };

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) });
  }
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders(req.headers.get("origin")) });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) } });
  }

  const { provider, model, prompt, settings } = body || {};
  if (!provider || !model || !prompt) {
    return new Response(JSON.stringify({ error: "provider, model, prompt required" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) } });
  }

  // Pricing gate/estimate
  const pricing = estimatePricing({ provider, model, prompt, settings });
  if (pricing.blocked) {
    return new Response(JSON.stringify({ error: "Model not available on current plan", pricing }), { status: 402, headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) } });
  }

  try {
    let raw;
    switch (provider) {
      case "openai":
        raw = await callOpenAI({ model, prompt, settings });
        break;
      case "anthropic":
        raw = await callAnthropic({ model, prompt, settings });
        break;
      case "gemini":
        raw = await callGemini({ model, prompt, settings });
        break;
      default:
        return new Response(JSON.stringify({ error: "Unsupported provider" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) } });
    }

    const result = normalize(raw, provider);
    return new Response(JSON.stringify({ ...result, model, pricing }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) } });
  } catch (e) {
    const message = e?.message || "Unknown error";
    return new Response(JSON.stringify({ error: message, pricing }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) } });
  }
}
