export function normalize(raw, provider) {
  if (provider === 'openai') {
    const text = raw?.choices?.[0]?.message?.content ?? '';
    return { text, usage: raw?.usage };
  }
  if (provider === 'anthropic') {
    const text = raw?.content?.[0]?.text ?? '';
    return { text, usage: raw?.usage };
  }
  // gemini
  const text = raw?.candidates?.[0]?.content?.parts?.map(p => p?.text || '').join('') ?? '';
  return { text, usage: raw?.usageMetadata };
}
