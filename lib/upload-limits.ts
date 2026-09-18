/**
 * Centralized image-upload size limits, in bytes, one per Supabase Storage
 * bucket that accepts a user-uploaded image. Keeping every limit here (as
 * opposed to a raw byte literal duplicated in each form/component) is what
 * keeps client-side validation, the upload helpers, and the user-facing
 * "Max NMB" text from drifting out of sync as limits change.
 *
 * `return-photos` is deliberately not included here — its 5MB limit is
 * defined and validated independently in
 * components/borrowings/ReturnForm.tsx and is out of scope for this table.
 */
export const IMAGE_UPLOAD_LIMITS = {
  /** `avatars` bucket — profile pictures (components/profile/AvatarUploader.tsx, app/profile/actions.ts). */
  avatar: 10 * 1024 * 1024,
  /** `instrument-images` bucket — components/admin/instruments/InstrumentForm.tsx. */
  instrument: 15 * 1024 * 1024,
  /** `event-images` bucket — components/admin/events/EventForm.tsx. */
  event: 20 * 1024 * 1024,
  /** `gallery-images` bucket — album covers and individual photos alike. */
  gallery: 20 * 1024 * 1024,
  /** `site-assets` bucket — club logo and favicon. */
  siteAsset: 5 * 1024 * 1024,
} as const;
