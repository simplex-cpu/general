import { createServerFn } from "@tanstack/react-start";
import { communityInput, communityProfileInput } from "./community";
import type { z } from "zod";

export const communityAction = createServerFn({ method: "POST" })
  .inputValidator((input: z.infer<typeof communityInput>) => communityInput.parse(input))
  .handler(async ({ data }) => {
    const { requireAccessCode } = await import("./accessCode.server");
    const auth = await requireAccessCode(data.accessCode);
    if (!auth.ok) throw new Error("Your access could not be verified. Please sign in again.");
    const { handleCommunity } = await import("./community.server");
    return handleCommunity(data, auth.record);
  });

export const communityProfile = createServerFn({ method: "POST" })
  .inputValidator((input: z.infer<typeof communityProfileInput>) => communityProfileInput.parse(input))
  .handler(async ({ data }) => {
    const { requireAccessCode } = await import("./accessCode.server");
    const auth = await requireAccessCode(data.accessCode);
    if (!auth.ok) throw new Error("Your access could not be verified. Please sign in again.");
    const { getCommunityProfile } = await import("./community.server");
    return getCommunityProfile(data.postId);
  });