// Shared with the QR route/lookup layer (lib/qr.ts, lib/supabase/instruments.ts)
// so client-side validation, server-side validation and the public RPC's
// defensive check all agree on exactly one definition of "valid code".
export const INSTRUMENT_CODE_PATTERN = /^[a-z0-9]+(_[a-z0-9]+)*$/;

export type InstrumentStatus =
  | "available"
  | "pending"
  | "borrowed"
  | "damaged"
  | "not_ready"
  | "maintenance";

export type InstrumentCondition = "excellent" | "good" | "fair" | "poor";

export interface Instrument {
  id: string;
  instrument_code: string;
  name: string;
  category: string;
  description: string | null;
  status: InstrumentStatus;
  condition: InstrumentCondition;
  image_url: string | null;
  purchase_date: string | null;
  notes: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export const INSTRUMENT_STATUSES: InstrumentStatus[] = [
  "available",
  "pending",
  "borrowed",
  "damaged",
  "not_ready",
  "maintenance",
];

/**
 * The subset of InstrumentStatus an admin may manually assign through the
 * instrument Create/Edit form (and the server actions behind it) —
 * everything except "pending" (a dead legacy value with no workflow behind
 * it) and "borrowed" (owned exclusively by the borrowing workflow: the
 * approve-request RPC is what moves an instrument to "borrowed", and the
 * return workflow is what moves it away). This is the single source of
 * truth for both the UI (components/admin/instruments/InstrumentForm.tsx)
 * and the server-side validation (app/admin/instruments/actions.ts) so the
 * two can never drift apart.
 */
export const MANUALLY_ASSIGNABLE_INSTRUMENT_STATUSES: InstrumentStatus[] = INSTRUMENT_STATUSES.filter(
  (status) => status !== "pending" && status !== "borrowed",
);

export const INSTRUMENT_CONDITIONS: InstrumentCondition[] = [
  "excellent",
  "good",
  "fair",
  "poor",
];

export const STATUS_LABELS: Record<InstrumentStatus, string> = {
  available: "Available",
  pending: "Pending",
  borrowed: "Borrowed",
  damaged: "Damaged",
  not_ready: "Not Ready",
  maintenance: "Maintenance",
};

export const CONDITION_LABELS: Record<InstrumentCondition, string> = {
  excellent: "Excellent",
  good: "Good",
  fair: "Fair",
  poor: "Poor",
};

// Shown on the detail page when status !== "available" so members know why
// they can't request the instrument.
export const STATUS_UNAVAILABLE_REASONS: Partial<Record<InstrumentStatus, string>> = {
  pending: "This instrument has a pending request and isn't available right now.",
  borrowed: "This instrument is currently borrowed by another member.",
  damaged: "This instrument is damaged and unavailable for borrowing.",
  not_ready: "This instrument isn't ready for use yet.",
  maintenance: "This instrument is currently under maintenance.",
};

/**
 * The safe subset of instrument fields returned by the public
 * `get_public_instrument_by_code` RPC (see the Module 9 migration) for
 * logged-out visitors scanning a QR code. Deliberately excludes id,
 * description, purchase_date, notes, archived_at and all timestamps —
 * anything not needed to identify the instrument on the public page.
 */
export interface PublicInstrument {
  instrument_code: string;
  name: string;
  category: string;
  image_url: string | null;
  status: InstrumentStatus;
  condition: InstrumentCondition;
}

export type InstrumentSort = "newest" | "oldest" | "name-asc" | "name-desc";

export type InstrumentArchiveState = "all" | "active" | "archived";

export interface InstrumentStats {
  total: number;
  available: number;
  borrowed: number;
  damaged: number;
  maintenance: number;
}
