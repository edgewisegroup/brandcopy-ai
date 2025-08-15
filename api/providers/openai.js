async function callOpenAI({ model, prompt, settings }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('Missing OPENAI_API_KEY');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: mapCreativity(settings?.creativity),
      max_tokens: mapLength(settings?.length),
    })
  });
  if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);
  return await res.json();
}

const mapCreativity = (c) => (typeof c === 'number' ? Math.min(Math.max((c/100)*1.2, 0), 1.2) : 0.7);
const mapLength = (len) => (len === 'short' ? 200 : len === 'long' ? 1200 : 600);

module.exports = { callOpenAI };
