export async function callGemini({ model, prompt, settings }) {
  const key = process.env.GOOGLE_API_KEY;
  if (!key) throw new Error('Missing GOOGLE_API_KEY');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${key}`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: mapCreativity(settings?.creativity),
        maxOutputTokens: mapLength(settings?.length)
      }
    })
  });
  if (!r.ok) throw new Error(`Gemini error ${r.status}`);
  return await r.json();
}

const mapCreativity = c => (typeof c === 'number' ? Math.max(0, Math.min(1.0, c / 100)) : 0.7);
const mapLength = len => (len === 'short' ? 200 : len === 'long' ? 1200 : 600);
