// @ts-nocheck -- Bun is the project's existing test runner.
import { test, expect } from 'bun:test';
import { operationStore } from './clipperOperations.server';
import { supabaseAdmin } from '@/integrations/supabase/client.server';
test('persistent lease blocks overlapping windows and rejects stale-token saves', async () => {
  const owner = `test-${crypto.randomUUID()}`;
  const ctx = { owner: { id: owner } };
  const key = `test:${owner}`;
  const store = await operationStore(ctx, 'test-long', key);
  try {
    await store.run(async token => {
      await expect(store.run(async () => 'duplicate')).rejects.toThrow('another window');
      await store.write({ completed: 1 }, token);
      await expect(store.write({ completed: 2 }, crypto.randomUUID())).rejects.toThrow('protection was lost');
      expect((await store.read()).payload.completed).toBe(1);
    });
    await store.run(async token => { await store.write({ completed: 2 }, token); });
    expect((await store.read()).payload.completed).toBe(2);
  } finally { await supabaseAdmin.from('long_form_operations').delete().eq('operation_key', key).eq('owner_id', owner); }
});