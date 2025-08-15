# BrandCopy AI (Static Demo)

Single-file web app (HTML/CSS/JS, no build step).

- Open `index.html` locally or serve via GitHub Pages.
- Optional: develop in GitHub Codespaces.

## Local Preview

Open `index.html` in your browser, or:

```bash
python3 -m http.server 5173
# then visit http://localhost:5173
```

## Optional: Real AI backend via Vercel (JS, no build)

This repo includes a minimal serverless API under `api/` (plain JavaScript). It proxies to OpenAI, Anthropic, or Google Gemini and normalizes the result. It also returns a simple price estimate and supports basic plan gating/surcharges.

Files (JS):

- `api/generate.js` — single endpoint that routes to a provider and returns `{ text, provider, model, pricing }`.
- `api/providers/openai.js`, `api/providers/anthropic.js`, `api/providers/gemini.js` — plain `fetch` calls to providers.
- `api/utils/normalize.js` — normalizes provider responses to a common shape.
- `api/utils/pricing.js` — plan allowlist + estimated cost + optional surcharge or block.
- `vercel.json` — maps `api/*.js` to Node 20 runtime.

Cross-origin usage:

- The API replies with permissive CORS headers and supports OPTIONS preflight.
- From the frontend, you can override the API base by setting `window.API_BASE` before calling generate, e.g. placing `<script>window.API_BASE = 'https://your-app.vercel.app';</script>` in `index.html`.

Plan gating header:

- You can optionally send `x-plan: free|pro|enterprise` to influence pricing/gating on the server. Defaults to `free` when absent.

Environment variables (Vercel → Project → Settings → Environment Variables):

- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GOOGLE_API_KEY`
- Optional pricing controls:
	- `PRICING_PLAN` = `free` | `pro` | `enterprise` (default: `free`)
	- `BLOCK_ABOVE_PLAN` = `true` | `false` (default: `false`) — block expensive models not in plan
	- `SURCHARGE_PERCENT` = integer like `25` (adds 25% surcharge)

Deploy on Vercel and call from the frontend:

```ts
// POST https://<your-vercel-domain>/api/generate
await fetch("/api/generate", {
	method: "POST",
	headers: { "content-type": "application/json", "x-plan": "free" },
	body: JSON.stringify({
		provider: "openai", // or "anthropic" | "gemini"
		model: "gpt-4o-mini", // e.g., claude-3.5-sonnet, gemini-1.5-pro
		prompt: "Write a friendly product blurb",
		settings: { creativity: 70, length: "medium" }
	})
});
```

Notes:

- CORS headers are included to allow calling the API from your static site (and preflight is handled).
- Uses Node runtime for reliable `process.env` access.
- You can swap to official SDKs later if preferred.
