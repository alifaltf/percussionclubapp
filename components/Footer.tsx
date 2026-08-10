import Image from "next/image";
import Link from "next/link";
import {
  EmailIcon,
  FacebookIcon,
  InstagramIcon,
  WhatsAppIcon,
  YoutubeIcon,
} from "@/components/ui/icons";
import { getSiteSettings } from "@/lib/supabase/settings";
import { DEFAULT_SITE_SETTINGS } from "@/types/settings";

const CLUB_LINKS = [
  { label: "Join Us", href: "#contact" },
  { label: "Login", href: "/login" },
  { label: "Instruments", href: "/instruments" },
  { label: "Announcements", href: "/announcements" },
];

export default async function Footer() {
  const settings = await getSiteSettings().catch(() => DEFAULT_SITE_SETTINGS);
  const logoUrl = settings.logo_url || "/images/percussion-club-logo.jpg";

  const exploreLinks = [
    { key: "home", label: "Home", href: "/" },
    { key: "about", label: "About", href: "/about" },
    { key: "gallery", label: "Gallery", href: "/gallery" },
    { key: "events", label: "Events", href: "/events" },
    { key: "mainboard", label: "Mainboard", href: "/#mainboard" },
    { key: "contact", label: "Contact", href: "/#contact" },
  ].filter((link) => {
    if (link.key === "gallery") return settings.allow_public_gallery;
    if (link.key === "events") return settings.allow_public_events;
    return true;
  });

  const socialLinks = [
    settings.instagram && {
      href: settings.instagram,
      label: `${settings.club_name} on Instagram`,
      Icon: InstagramIcon,
    },
    settings.facebook && {
      href: settings.facebook,
      label: `${settings.club_name} on Facebook`,
      Icon: FacebookIcon,
    },
    settings.youtube && {
      href: settings.youtube,
      label: `${settings.club_name} on YouTube`,
      Icon: YoutubeIcon,
    },
    settings.whatsapp && {
      href: settings.whatsapp,
      label: `Message ${settings.club_name} on WhatsApp`,
      Icon: WhatsAppIcon,
    },
    { href: `mailto:${settings.email}`, label: `Email ${settings.club_name}`, Icon: EmailIcon },
  ].filter(Boolean) as { href: string; label: string; Icon: typeof EmailIcon }[];

  const contactDetails = [settings.location, settings.email, settings.instagram].filter(
    (value): value is string => Boolean(value),
  );

  return (
    <footer className="border-t border-[#E8E8E8] bg-[#F8F8F6]">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {/* Column 1 — brand */}
          <div>
            <Link href="/" className="inline-flex items-center">
              <Image
                src={logoUrl}
                alt={`${settings.club_name} logo`}
                width={64}
                height={64}
                className="h-12 w-12 object-contain"
              />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#666666]">
              {settings.tagline || settings.description}
            </p>
            <div className="mt-6 flex items-center gap-3">
              {socialLinks.map(({ href, label, Icon }) => (
                <a
                  key={href}
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E8E8E8] text-[#666666] transition-colors duration-300 hover:border-[#C8A928] hover:text-[#C8A928]"
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          {/* Column 2 — Explore */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">
              Explore
            </h3>
            <ul className="mt-5 space-y-3">
              {exploreLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#666666] transition-colors duration-300 hover:text-[#C8A928]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 — Club */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">
              Club
            </h3>
            <ul className="mt-5 space-y-3">
              {CLUB_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#666666] transition-colors duration-300 hover:text-[#C8A928]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 — Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">
              Contact
            </h3>
            <ul className="mt-5 space-y-3">
              {contactDetails.map((detail) => (
                <li key={detail} className="text-sm text-[#666666]">
                  {detail}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom row */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-[#E8E8E8] pt-8 sm:flex-row">
          <div className="flex flex-col items-center gap-1 text-center sm:flex-row sm:gap-3 sm:text-left">
            <p className="text-xs text-[#666666]">
              © {new Date().getFullYear()} {settings.club_name}. All rights reserved.
            </p>
            <span className="hidden text-[#E8E8E8] sm:inline">•</span>
            <p className="text-xs text-[#666666]">Built with rhythm.</p>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="#"
              className="text-xs text-[#666666] transition-colors duration-300 hover:text-[#C8A928]"
            >
              Privacy Policy
            </Link>
            <Link
              href="#"
              className="text-xs text-[#666666] transition-colors duration-300 hover:text-[#C8A928]"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
