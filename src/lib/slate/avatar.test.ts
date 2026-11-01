// @ts-ignore Bun supplies its test runner at runtime.
import { describe, expect, test } from "bun:test";
import { avatarBlocker } from "./avatar";

describe("send to avatar", () => {
  test("a talking video with a script can go", () => expect(avatarBlocker({ "Post Type": "📹 Talking Video", "Script Text": "Hello" })).toBeNull());
  test("talking videos from long form count too", () => expect(avatarBlocker({ "Post Type": "📹 Talking from long form", "Script Text": "Hi" })).toBeNull());
  test("other formats can't", () => expect(avatarBlocker({ "Post Type": "🖼️ Carousel", "Script Text": "Hi" })).toContain("Only talking videos"));
  test("a script is required", () => expect(avatarBlocker({ "Post Type": "📹 Talking Video", "Script Text": "  " })).toContain("Add the script"));
  test("it isn't sent twice", () => expect(avatarBlocker({ "Post Type": "📹 Talking Video", "Script Text": "Hi", "Client Status": "To Avatar" })).toContain("already"));
});
