// @ts-ignore Bun supplies its test runner at runtime.
import { afterEach, describe, expect, test } from "bun:test";
import { DEFAULT_PROMPTS } from "./simplex/prompts";
import { clearLivePromptsCache, loadLivePrompts } from "./promptStore.server";

const realFetch = globalThis.fetch;
const realToken = process.env.AIRTABLE_TOKEN;

function airtableReturns(records: unknown[]) {
  let calls = 0;
  globalThis.fetch = (async () => {
    calls++;
    return new Response(JSON.stringify({ records }), { status: 200 });
  }) as typeof fetch;
  return () => calls;
}

const version = (key: string, n: number, text: string) => ({
  id: `rec${key}${n}`,
  fields: { "Prompt Key": key, "Version Number": n, "Prompt Text": text, "Saved At ISO": `2026-11-0${n}T00:00:00Z` },
});

afterEach(() => {
  globalThis.fetch = realFetch;
  if (realToken === undefined) delete process.env.AIRTABLE_TOKEN;
  else process.env.AIRTABLE_TOKEN = realToken;
  clearLivePromptsCache();
});

describe("live prompts", () => {
  test("without an Airtable token the defaults are used", async () => {
    delete process.env.AIRTABLE_TOKEN;
    expect(await loadLivePrompts()).toEqual(DEFAULT_PROMPTS);
  });

  test("the newest saved version of a prompt replaces the default", async () => {
    process.env.AIRTABLE_TOKEN = "test";
    airtableReturns([version("hookTalking", 1, "old"), version("hookTalking", 2, "new")]);
    const prompts = await loadLivePrompts();
    expect(prompts.hookTalking).toBe("new");
    expect(prompts.framework).toBe(DEFAULT_PROMPTS.framework);
  });

  test("unknown prompt keys are ignored", async () => {
    process.env.AIRTABLE_TOKEN = "test";
    airtableReturns([version("notAPrompt", 1, "x")]);
    expect(await loadLivePrompts()).toEqual(DEFAULT_PROMPTS);
  });

  test("a batch of calls reads Airtable once, and saving clears it", async () => {
    process.env.AIRTABLE_TOKEN = "test";
    const calls = airtableReturns([version("brollScript", 1, "v1")]);
    await loadLivePrompts();
    await loadLivePrompts();
    expect(calls()).toBe(1);
    clearLivePromptsCache();
    await loadLivePrompts();
    expect(calls()).toBe(2);
  });

  test("if Airtable fails, generation keeps going with the defaults", async () => {
    process.env.AIRTABLE_TOKEN = "test";
    globalThis.fetch = (async () => new Response("{}", { status: 500 })) as typeof fetch;
    expect(await loadLivePrompts()).toEqual(DEFAULT_PROMPTS);
  });
});
