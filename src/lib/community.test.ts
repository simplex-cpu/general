// @ts-nocheck -- Bun provides this module to its test runner.
import { describe, expect, test } from "bun:test";
import { communityInput, extractHashtags, ownsCommunityPost, assertCommunityPostPermission, publicCommunityProfile, safeProfileLink } from "./community";

describe("Shared community contract", () => {
  test("public profiles expose only photo, name, bio, website and Instagram", () => {
    expect(publicCommunityProfile({ "Client Name": "Creator", "Community Bio": "My bio", "Community Website": "https://example.com", "Community Instagram": "@creator", Code: "private", Email: "private", "Profile Picture": [{url: "https://example.com/photo.jpg"}] }, "Fallback")).toEqual({ name: "Creator", bio: "My bio", website: "https://example.com/", instagram: "https://www.instagram.com/creator/", photo: "https://example.com/photo.jpg" });
  });
  test("profile links reject scripts and fake Instagram hosts", () => {
    expect(safeProfileLink("javascript:alert(1)")).toBe("");
    expect(safeProfileLink("https://example.com", true)).toBe("");
  });
  test("only the team can publish strategy recommendations", () => {
    expect(() => assertCommunityPostPermission("strategy", "User")).toThrow("Only the team");
    for (const role of ["Admin", "Strat", "Strats", "Strategist"]) expect(() => assertCommunityPostPermission("strategy", role)).not.toThrow();
    expect(() => assertCommunityPostPermission("general", "User")).not.toThrow();
  });
  test("strategy feed and post category are supported explicitly", () => {
    expect(communityInput.parse({ accessCode: "member", action: "feed", filter: "strategy" }).filter).toBe("strategy");
    expect(communityInput.safeParse({ accessCode: "member", action: "post", body: "Idea", category: "fake" }).success).toBe(false);
  });
  test("emoji posts retain their full text", () => {
    expect(communityInput.parse({ accessCode: "member", action: "post", body: "A win 🎉🚀💚" }).body).toBe("A win 🎉🚀💚");
  });
  test("tags and hashtags persist together without duplicates", () => {
    expect(extractHashtags("A win! #Growth #growth #Créateurs", ["Wins"])).toEqual(["wins", "growth", "créateurs"]);
  });
  test("support links cannot execute scripts", () => {
    expect(communityInput.safeParse({ accessCode: "member", action: "post", body: "Support this", supportUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(communityInput.safeParse({ accessCode: "member", action: "post", body: "Support this", supportUrl: "https://instagram.com/p/example" }).success).toBe(true);
  });
  test("only the owner can delete a shared post", () => {
    expect(ownsCommunityPost("client-a", "client-b")).toBe(false);
    expect(ownsCommunityPost("client-a", "client-a")).toBe(true);
  });
  test("posts and reactions require signed-in access", () => {
    expect(communityInput.safeParse({ accessCode: "", action: "post", body: "Hello" }).success).toBe(false);
  });
});