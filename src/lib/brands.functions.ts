import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAccessCode } from "./accessCode.server";
import { listOwnedBriefs, createOwnedBrand } from "./brands.server";

export const listMyBrands = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ accessCode: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    const auth = await requireAccessCode(data.accessCode);
    if (!auth.ok) throw new Error("Please sign in again to view your brands");
    const token = process.env.AIRTABLE_TOKEN;
    if (!token) throw new Error("Brand service unavailable");
    return listOwnedBriefs(auth.record, token);
  });
export const addMyBrand = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ accessCode: z.string().min(1), name: z.string().trim().min(1).max(200) }).parse(input))
  .handler(async ({ data }) => {
    const auth = await requireAccessCode(data.accessCode);
    if (!auth.ok) throw new Error("Please sign in again to add a brand");
    const token = process.env.AIRTABLE_TOKEN;
    if (!token) throw new Error("Brand service unavailable");
    return createOwnedBrand(auth.record, token, data.name);
  });