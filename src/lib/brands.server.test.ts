// @ts-ignore Bun supplies its test runner at runtime.
import { describe, expect, test } from "bun:test";
import { createOwnedBrand, selectedBrief } from "./brands.server";
import type { AccessRecord } from "./accessCode.server";
const access: AccessRecord = { id: "recCode", code: "fixture", clientName: "Fixture", userType: "User", active: true, fields: { "Users (from Brand)": ["recOwner"] } };
const mine = "recAAAAAAAAAAAAAA";
const other = "recBBBBBBBBBBBBBB";
const brief = "recCCCCCCCCCCCCCC";
function response(data: unknown) { return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } }); }

describe("owned brand persistence", () => {
  test("new brief links to its brand without changing legacy access-code context", async () => {
    const original = globalThis.fetch;
    const writes: Array<{ path: string; fields: Record<string, unknown> }> = [];
    globalThis.fetch = async (url, init) => {
      const path = String(url);
      if (init?.method === "POST") {
        const body = JSON.parse(String(init.body)); writes.push({ path, fields: body.fields });
        return response({ id: writes.length === 1 ? mine : brief, fields: body.fields });
      }
      if (path.includes("tblO9nM6xTdzJyyax/")) return response({ fields: { Brands: [] } });
      throw new Error("Unexpected request");
    };
    try {
      const created = await createOwnedBrand(access, "fixture-token", "New Brand");
      expect(created.id).toBe(brief);
      expect(writes[0]?.fields.Users).toEqual(["recOwner"]);
      expect(writes[1]?.fields.Brand).toEqual([mine]);
      expect(writes[1]?.fields.User).toBeUndefined();
      expect(writes[0]?.fields["Access code user"]).toBeUndefined();
    } finally { globalThis.fetch = original; }
  });
  test("selected brief rejects a linked brand owned by somebody else", async () => {
    const original = globalThis.fetch;
    globalThis.fetch = async (url) => {
      const path = String(url);
      if (path.includes("?maxRecords=")) return response({ records: [] });
      if (path.includes("tblO9nM6xTdzJyyax/")) return response({ fields: { Brands: [mine] } });
      if (path.includes(`tblho1mwlIMZfozue/${mine}`)) return response({ fields: { Users: ["recOwner"] } });
      if (path.includes(`tblkV5xOB2D1N5dNH/${brief}`)) return response({ id: brief, fields: { Brand: [other] } });
      throw new Error("Unexpected request");
    };
    try { expect(await selectedBrief(access, "fixture-token", brief)).toBeNull(); }
    finally { globalThis.fetch = original; }
  });
  test("selected owned brief reads back through the exact brand link", async () => {
    const original = globalThis.fetch;
    globalThis.fetch = async (url) => {
      const path = String(url);
      if (path.includes("?maxRecords=")) return response({ records: [] });
      if (path.includes("tblO9nM6xTdzJyyax/")) return response({ fields: { Brands: [mine] } });
      if (path.includes(`tblho1mwlIMZfozue/${mine}`)) return response({ fields: { Users: ["recOwner"] } });
      if (path.includes(`tblkV5xOB2D1N5dNH/${brief}`)) return response({ id: brief, fields: { Brand: [mine], "Brand Name": "Saved brand" } });
      throw new Error("Unexpected request");
    };
    try { expect((await selectedBrief(access, "fixture-token", brief))?.fields["Brand Name"]).toBe("Saved brand"); }
    finally { globalThis.fetch = original; }
  });
});
