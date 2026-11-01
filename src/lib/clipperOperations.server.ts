// Private operation state. Every caller must already have verified the access-code owner.
import type { ClipperCtx } from './longForm.server';
import type { Json } from '@/integrations/supabase/types';

export class ClipperOperationError extends Error {
  constructor(message: string, public status = 409) { super(message); }
}
export async function operationStore(ctx: ClipperCtx, longId: string, key = `generate:${longId}`) {
  const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
  const read = async () => {
    const { data, error } = await db.from('long_form_operations').select('*').eq('operation_key', key).eq('owner_id', ctx.owner.id).maybeSingle();
    if (error) throw new ClipperOperationError('The processing record could not be read. No work was started.', 503);
    return data;
  };
  const write = async (payload: Record<string, unknown>, token?: string) => {
    let q = db.from('long_form_operations').update({ payload: payload as Json, updated_at: new Date().toISOString() }).eq('operation_key', key).eq('owner_id', ctx.owner.id);
    if (token) q = q.eq('lease_token', token);
    const { data, error } = await q.select('operation_key');
    if (error || !data?.length) throw new ClipperOperationError('Progress protection was lost. Stop and reopen this long form.', 503);
  };
  const run = async <T>(fn: (token: string, payload: Record<string, any>) => Promise<T>) => {
    const token = crypto.randomUUID();
    const { data, error } = await db.rpc('acquire_long_form_operation', { p_key: key, p_owner: ctx.owner.id, p_long: longId, p_token: token, p_seconds: 900 });
    if (error) throw new ClipperOperationError('Processing protection is unavailable. No work was started.', 503);
    if (!data) throw new ClipperOperationError('This long form is already being processed in another window. Wait for it to finish.');
    try { const row = await read(); return await fn(token, (row?.payload || {}) as Record<string, any>); }
    finally { await db.from('long_form_operations').update({ lease_token: null, lease_until: null }).eq('operation_key', key).eq('owner_id', ctx.owner.id).eq('lease_token', token); }
  };
  return { read, write, run };
}