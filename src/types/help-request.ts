export type HelpRequestStatus =
  "pending" | "accepted" | "cancelled" | "completed";

type HelpRequestBase = {
  id: string;
  status: HelpRequestStatus;
  created_at: string;
  accepted_at: string | null;
  completion_requested_at?: string | null;
  completion_supported?: boolean;
};

export type HelperHelpRequest = HelpRequestBase & {
  recipient_name: string;
};

export type RecipientHelpRequest = HelpRequestBase & {
  recipient_id: string;
  helper_name: string | null;
};
