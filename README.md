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

## Optional: Real AI backend via Vercel

This repo includes a minimal serverless API under `api/` plus provider helpers in `providers/` and a `utils/normalize.ts`.

Files:

- `api/generate.ts` — single endpoint that routes to a provider and returns `{ text, provider, usage }`.
- `providers/openai.ts`, `providers/anthropic.ts`, `providers/gemini.ts` — plain fetch calls to providers.
- `utils/normalize.ts` — normalizes responses to a common shape.

Environment variables (Vercel → Project → Settings → Environment Variables):

- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GOOGLE_API_KEY`

Deploy on Vercel and call from the frontend:

```ts
// POST https://<your-vercel-domain>/api/generate
await fetch("/api/generate", {
	method: "POST",
	headers: { "content-type": "application/json" },
	body: JSON.stringify({
		provider: "openai", // or "anthropic" | "gemini"
		model: "gpt-4o-mini", // e.g., claude-3.5-sonnet, gemini-1.5-pro
		prompt: "Write a friendly product blurb",
		settings: { creativity: 70, length: "medium" }
	})
});
```

Notes:

- CORS headers are included to allow calling the API from your static site.
- You can swap to official SDKs later if preferred.
