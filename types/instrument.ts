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

export type InstrumentSort = "newest" | "oldest" | "name-asc" | "name-desc";

export type InstrumentArchiveState = "all" | "active" | "archived";

export interface InstrumentStats {
  total: number;
  available: number;
  borrowed: number;
  damaged: number;
  maintenance: number;
}
