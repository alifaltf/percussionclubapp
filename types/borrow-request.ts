import type { Instrument, InstrumentCondition } from "@/types/instrument";
import type { Profile } from "@/types/profile";

export type BorrowRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "active"
  | "return_submitted"
  | "completed"
  | "overdue";

export interface BorrowRequest {
  id: string;
  member_id: string;
  instrument_id: string;
  purpose: string;
  requested_borrow_date: string;
  requested_return_date: string;
  status: BorrowRequestStatus;
  admin_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  actual_borrow_date: string | null;
  actual_return_date: string | null;
  return_photo_url: string | null;
  return_notes: string | null;
  condition_before: InstrumentCondition | null;
  condition_after: InstrumentCondition | null;
  damage_reported: boolean;
  damage_notes: string | null;
  damage_reported_at: string | null;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export type BorrowRequestInstrument = Pick<
  Instrument,
  "id" | "instrument_code" | "name" | "category" | "image_url"
>;

export type BorrowRequestMember = Pick<Profile, "id" | "full_name" | "avatar_url" | "phone">;

export interface BorrowRequestWithInstrument extends BorrowRequest {
  instrument: BorrowRequestInstrument;
}

export interface BorrowRequestAdminView extends BorrowRequest {
  instrument: BorrowRequestInstrument;
  member: BorrowRequestMember;
}

export const BORROW_REQUEST_STATUSES: BorrowRequestStatus[] = [
  "pending",
  "approved",
  "rejected",
  "cancelled",
  "active",
  "return_submitted",
  "completed",
  "overdue",
];

export const BORROW_REQUEST_STATUS_LABELS: Record<BorrowRequestStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
  active: "Active",
  return_submitted: "Return Submitted",
  completed: "Completed",
  overdue: "Overdue",
};

// Statuses that still count as "currently borrowed" for /my-borrowings and
// the overdue check (requested_return_date passed while still active).
export const ACTIVE_BORROW_STATUSES: BorrowRequestStatus[] = [
  "active",
  "return_submitted",
  "overdue",
];
