// Minimal Upstash Redis REST client (no SDK) to avoid extra deps.
// Provides get/set with TTL using fetch against REST API.

const BASE = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

async function callRedis(path, body) {
  if (!BASE || !TOKEN) return { skipped: true, reason: 'No Upstash REST creds' };
  const url = `${BASE}/${path}`.replace(/\/+/, '/');
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify(body || {})
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.error || `Redis error ${r.status}`);
  return data;
}

export async function redisSet(key, value, ttlSec) {
  const args = ttlSec ? [key, JSON.stringify(value), { ex: ttlSec }] : [key, JSON.stringify(value)];
  return callRedis('set', { args });
}

export async function redisGet(key) {
  const data = await callRedis('get', { args: [key] });
  if (data?.result == null) return null;
  try { return JSON.parse(data.result); } catch { return data.result; }
}
