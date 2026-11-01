// @ts-nocheck -- Bun provides this module to its test runner.
import { expect, test } from "bun:test";
import { createSessionStarter, hasSelectedWriterFormat } from "./writerSessionLifecycle";

test("starting a session creates its History record immediately, before scripts exist", async () => {
  let calls = 0;
  const start = createSessionStarter(async () => {
    calls++;
    return { id: "rec12345678901234", scripts: [] };
  });
  const first = start();
  expect(calls).toBe(1);
  expect(await first).toEqual({ id: "rec12345678901234", scripts: [] });
  await start();
  expect(calls).toBe(1);
});

test("starting from the beginning creates a separate History record", async () => {
  let calls = 0;
  const create = async () => ({ id: `session-${++calls}` });
  const oldStart = createSessionStarter(create);
  expect((await oldStart()).id).toBe("session-1");
  const newStart = createSessionStarter(create);
  expect((await newStart()).id).toBe("session-2");
});
test("sessions start only after format selection", () => {
  for (const value of [undefined, "single", "batch"]) expect(hasSelectedWriterFormat(value)).toBe(false);
  for (const value of ["broll", "talkingVideo", "carousel", "graphic"]) expect(hasSelectedWriterFormat(value)).toBe(true);
});
