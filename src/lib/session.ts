import { cache } from "react";
import { auth } from "@/lib/auth";

// React cache() deduplicates this call within a single render pass —
// if multiple server components call getSession(), only ONE JWT
// verification happens per request.
export const getSession = cache(async () => {
  return auth();
});