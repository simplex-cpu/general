// @ts-nocheck -- Bun provides this module to its test runner.
import { describe, expect, test } from "bun:test";
import { deriveSingleScriptTopic } from "./scriptChat";

describe("single-script topic titles", () => {
  test("derives a concise title from a long raw idea", () => {
    expect(
      deriveSingleScriptTopic(
        "Why most small businesses don't show up in ChatGPT answers, and the three fixes that improve their visibility over time",
      ),
    ).toBe("Why most small businesses don't show up in ChatGPT answers, and the");
  });

  test("removes a conversational preamble", () => {
    expect(deriveSingleScriptTopic("I want to talk about building trust before asking for a sale."))
      .toBe("building trust before asking for a sale");
  });
});