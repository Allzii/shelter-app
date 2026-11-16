export type CertificateStatus = "pending" | "approved" | "needs_changes";

export type CertificateReview = {
  status: CertificateStatus;
  review_note: string | null;
};
