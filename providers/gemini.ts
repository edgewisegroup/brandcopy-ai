export async function callGemini({ model, prompt, settings }: any) {
  const key = process.env.GOOGLE_API_KEY!;
  if (!key) throw new Error("Missing GOOGLE_API_KEY");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${key}`;
  const res = await fetch(url, {
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
  if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
  return await res.json();
}

const mapCreativity = (c?: number) => typeof c === 'number' ? Math.min(Math.max((c/100)*1.0, 0), 1.0) : 0.7;
const mapLength = (len?: string) => len === 'short' ? 200 : len === 'long' ? 1200 : 600;
