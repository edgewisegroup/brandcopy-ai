export async function callOpenAI({ model, prompt, settings }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('Missing OPENAI_API_KEY');
  const body = {
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature: mapCreativity(settings?.creativity),
    max_tokens: mapLength(settings?.length)
  };
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error(`OpenAI error ${r.status}`);
  return await r.json();
}

const mapCreativity = c => (typeof c === 'number' ? Math.max(0, Math.min(1.2, c / 100 * 1.2)) : 0.7);
const mapLength = len => (len === 'short' ? 200 : len === 'long' ? 1200 : 600);
