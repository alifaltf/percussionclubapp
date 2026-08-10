import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { getSiteSettings } from "@/lib/supabase/settings";
import { DEFAULT_SITE_SETTINGS } from "@/types/settings";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

/**
 * club_name is database-driven, so the page title can't be a static export
 * anymore. Falls back to the same default the database seeds if the
 * settings query fails, so a settings outage never breaks the <title>.
 */
export async function generateMetadata(): Promise<Metadata> {
  let clubName = DEFAULT_SITE_SETTINGS.club_name;
  try {
    const settings = await getSiteSettings();
    clubName = settings.club_name || clubName;
  } catch {
    // Keep the fallback — never let a metadata failure break page rendering.
  }

  return {
    title: clubName,
    description: `Official website of the ${clubName}.`,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let settings = DEFAULT_SITE_SETTINGS;
  try {
    settings = await getSiteSettings();
  } catch {
    // Fall back to the defaults — the branding variables below and the
    // Navbar/Footer (which read settings independently) all degrade the
    // same way.
  }

  // Defensive re-validation: these were already checked as hex colors by
  // the settings Server Actions before being saved, but re-checking here
  // means a malformed value (e.g. an edit made directly in the database)
  // can never inject anything unexpected into this inline style.
  const brandVars: CSSProperties = {
    ["--brand-primary" as string]: HEX_COLOR_PATTERN.test(settings.primary_color)
      ? settings.primary_color
      : DEFAULT_SITE_SETTINGS.primary_color,
    ["--brand-accent" as string]: HEX_COLOR_PATTERN.test(settings.accent_color)
      ? settings.accent_color
      : DEFAULT_SITE_SETTINGS.accent_color,
    ["--brand-background" as string]: HEX_COLOR_PATTERN.test(settings.background_color)
      ? settings.background_color
      : DEFAULT_SITE_SETTINGS.background_color,
    ["--brand-text" as string]: HEX_COLOR_PATTERN.test(settings.text_color)
      ? settings.text_color
      : DEFAULT_SITE_SETTINGS.text_color,
  };

  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfairDisplay.variable} h-full antialiased`}
      style={brandVars}
    >
      <body className="min-h-full flex flex-col font-sans">
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
