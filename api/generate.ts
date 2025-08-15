// Serverless AI router for Vercel (Edge runtime). If you use Next.js, this works in /app/api too.
// Handles cross-provider calls and normalizes the output shape.

import { normalize } from "../utils/normalize";
import { callOpenAI } from "../providers/openai";
import { callAnthropic } from "../providers/anthropic";
import { callGemini } from "../providers/gemini";

// Use Node.js runtime to access process.env reliably on Vercel
export const config = { runtime: "nodejs" } as const;

function corsHeaders(origin?: string) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  } as Record<string, string>;
}

export default async function handler(req: Request): Promise<Response> {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(req.headers.get("origin") || undefined) });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders(req.headers.get("origin") || undefined) });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin") || undefined) } });
  }

  const { provider, model, prompt, settings } = body || {};

  if (!provider || !model || !prompt) {
    return new Response(JSON.stringify({ error: "provider, model, prompt required" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin") || undefined) },
    });
  }

  try {
    let raw: any;
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
        return new Response(JSON.stringify({ error: "Unsupported provider" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin") || undefined) } });
    }

    const result = normalize(raw, provider);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin") || undefined) },
    });
  } catch (e: any) {
    const message = e?.message || "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin") || undefined) },
    });
  }
}
