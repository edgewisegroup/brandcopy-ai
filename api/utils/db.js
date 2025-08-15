// Lightweight Postgres access via @vercel/postgres
// Exposes a tagged template `sql` and helper functions.
import { sql as vercelSql } from '@vercel/postgres';

export const sql = vercelSql;

export async function recordUsage({
  clerk_user_id,
  provider,
  model,
  prompt_tokens = 0,
  completion_tokens = 0,
  total_tokens = 0,
  unit = 'token'
}) {
  if (!process.env.DATABASE_URL) return { skipped: true, reason: 'No DATABASE_URL' };
  try {
    await sql`
      insert into usage_events (clerk_user_id, provider, model, prompt_tokens, completion_tokens, total_tokens, unit)
      values (${clerk_user_id}, ${provider}, ${model}, ${prompt_tokens}, ${completion_tokens}, ${total_tokens}, ${unit})
    `;
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}
