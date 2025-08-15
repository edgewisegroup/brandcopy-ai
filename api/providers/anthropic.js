export async function callAnthropic({ model, prompt, settings }) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('Missing ANTHROPIC_API_KEY');
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model,
      max_tokens: mapLength(settings?.length),
      temperature: mapCreativity(settings?.creativity),
      messages: [{ role: 'user', content: prompt }]
    })
  });
  if (!r.ok) throw new Error(`Anthropic error ${r.status}`);
  return await r.json();
}

const mapCreativity = c => (typeof c === 'number' ? Math.max(0, Math.min(1.0, c / 100)) : 0.7);
const mapLength = len => (len === 'short' ? 200 : len === 'long' ? 1200 : 600);
