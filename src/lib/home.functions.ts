import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const homeContent = createServerFn({ method: "POST" })
  .inputValidator((input: { accessCode: string }) => z.object({ accessCode: z.string().min(1).max(200) }).parse(input))
  .handler(async ({ data }) => {
    const { requireAccessCode } = await import("./accessCode.server");
    const auth = await requireAccessCode(data.accessCode);
    if (!auth.ok) throw new Error("Your access could not be verified. Please sign in again.");
    const { readHomeContent } = await import("./home.server");
    return readHomeContent(auth.record);
  });