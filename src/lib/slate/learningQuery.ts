import { queryOptions } from "@tanstack/react-query";
import type { LearningPayload } from "@/components/slate/learning/types";

export function learningQueryOptions(accessCode: string) {
  return queryOptions({
    queryKey: ["learning", accessCode], enabled: !!accessCode, staleTime: 60_000,
    queryFn: async (): Promise<LearningPayload> => {
      const response = await fetch("/api/learning", { headers: { "x-access-code": accessCode } });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Could not load your learning plan");
      return result;
    },
  });
}