export interface SiteSettings {
  id: number;

  // Club identity
  club_name: string;
  short_name: string;
  tagline: string;
  description: string;
  logo_url: string | null;
  favicon_url: string | null;

  // Contact
  email: string;
  phone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  facebook: string | null;
  youtube: string | null;
  location: string;
  rehearsal_schedule: string;

  // Public homepage
  hero_heading: string;
  hero_subheading: string;
  about_heading: string;
  about_text: string;
  join_us_url: string;
  contact_cta_text: string;
  // Homepage CMS images — each nullable; the public Hero/About components
  // fall back to the original hardcoded /public images whenever null. See
  // the Settings CMS audit/implementation for the full rationale.
  hero_image_1_url: string | null;
  hero_image_2_url: string | null;
  hero_image_3_url: string | null;
  hero_image_4_url: string | null;
  about_image_url: string | null;

  // Branding
  primary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;

  // Behavior / feature toggles
  allow_public_gallery: boolean;
  allow_public_events: boolean;
  allow_member_borrowing: boolean;
  maintenance_mode: boolean;

  created_at: string;
  updated_at: string;
}

/**
 * Matches the database column defaults exactly (see the Module 8 migration
 * and the later Settings CMS image columns added directly against the live
 * database). Used whenever the settings query fails or the row is somehow
 * missing, so the public site degrades to these known-good values instead
 * of breaking.
 */
export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  id: 1,

  club_name: "IIUM Percussion Club",
  short_name: "IPC",
  tagline: "Rhythm. Unity. Performance.",
  description: "Building rhythm, confidence and community through percussion.",
  logo_url: null,
  favicon_url: null,

  email: "percussionclub@iium.edu.my",
  phone: null,
  whatsapp: null,
  instagram: null,
  facebook: null,
  youtube: null,
  location: "International Islamic University Malaysia",
  rehearsal_schedule: "Every Friday, 8:00 PM",

  hero_heading: "IIUM Percussion Club",
  hero_subheading: "Rhythm. Unity. Performance.",
  about_heading: "More Than Rhythm",
  about_text:
    "IIUM Percussion Club brings students together through rhythm, creativity and performance. We create a space where members can grow musically, build confidence and form meaningful connections through percussion.",
  join_us_url: "/contact",
  contact_cta_text: "Join Us",
  hero_image_1_url: null,
  hero_image_2_url: null,
  hero_image_3_url: null,
  hero_image_4_url: null,
  about_image_url: null,

  primary_color: "#C8A928",
  accent_color: "#9E8217",
  background_color: "#FFFFFF",
  text_color: "#111111",

  allow_public_gallery: true,
  allow_public_events: true,
  allow_member_borrowing: true,
  maintenance_mode: false,

  created_at: "1970-01-01T00:00:00.000Z",
  updated_at: "1970-01-01T00:00:00.000Z",
};

export type SettingsSection = "general" | "contact" | "homepage" | "branding" | "features";

export const SETTINGS_SECTIONS: { key: SettingsSection; label: string }[] = [
  { key: "general", label: "General" },
  { key: "contact", label: "Contact" },
  { key: "homepage", label: "Homepage" },
  { key: "branding", label: "Branding" },
  { key: "features", label: "Features" },
];

export interface SettingsActionState {
  status: "idle" | "success" | "error";
  message: string | null;
}
