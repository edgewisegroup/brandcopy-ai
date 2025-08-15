async function callAnthropic({ model, prompt, settings }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('Missing ANTHROPIC_API_KEY');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: mapLength(settings?.length),
      temperature: mapCreativity(settings?.creativity),
      messages: [{ role: 'user', content: prompt }],
    })
  });
  if (!res.ok) throw new Error(`Anthropic error: ${res.status}`);
  return await res.json();
}

const mapCreativity = (c) => (typeof c === 'number' ? Math.min(Math.max((c/100)*1.0, 0), 1.0) : 0.7);
const mapLength = (len) => (len === 'short' ? 200 : len === 'long' ? 1200 : 600);

module.exports = { callAnthropic };
