// @ts-nocheck
import { test, expect } from "bun:test";
import { splitWhyItWorks } from "./inspoBank";
test("splits labelled analysis into hook template and framework", () => {
  expect(splitWhyItWorks("Hook template: Stop doing X if you want Y\nFramework: Problem, proof, fix")).toEqual({ hook: "Stop doing X if you want Y", framework: "Problem, proof, fix" });
});
test("unlabelled analysis goes entirely to framework", () => {
  expect(splitWhyItWorks("Strong opening and a clear payoff.")).toEqual({ hook: "", framework: "Strong opening and a clear payoff." });
});
