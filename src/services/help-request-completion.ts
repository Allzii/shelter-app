import { supabase } from "@/lib/supabase";

import type { HelpRequestStatus } from "@/types/help-request";

type CompletionState = {
  status: HelpRequestStatus;
  completion_requested_at: string | null;
  completed_at: string | null;
};

// Keep the existing request flow usable before the optional SQL upgrade is run.
export async function getHelpRequestCompletion(
  requestId: string,
  signal?: AbortSignal,
): Promise<CompletionState | null> {
  const query = supabase.rpc("get_help_request_completion", {
    p_request_id: requestId,
  });
  const { data, error } = await (
    signal ? query.abortSignal(signal) : query
  ).maybeSingle<CompletionState>();
  if (error || !data) return null;
  if (!["pending", "accepted", "cancelled", "completed"].includes(data.status))
    return null;
  return data;
}
