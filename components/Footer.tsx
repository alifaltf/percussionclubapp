import Image from "next/image";
import Link from "next/link";
import { EmailIcon, InstagramIcon } from "@/components/ui/icons";

const EXPLORE_LINKS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Gallery", href: "/gallery" },
  { label: "Events", href: "/events" },
  { label: "Mainboard", href: "/#mainboard" },
  { label: "Contact", href: "/#contact" },
];

const CLUB_LINKS = [
  { label: "Join Us", href: "#contact" },
  { label: "Login", href: "/login" },
  { label: "Instruments", href: "/instruments" },
  { label: "Announcements", href: "/announcements" },
];

const CONTACT_DETAILS = [
  "International Islamic University Malaysia",
  "percussionclub@iium.edu.my",
  "@iiumpercussionclub",
];

export default function Footer() {
  return (
    <footer className="border-t border-[#E8E8E8] bg-[#F8F8F6]">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {/* Column 1 — brand */}
          <div>
            <Link href="/" className="inline-flex items-center">
              <Image
                src="/images/percussion-club-logo.jpg"
                alt="IIUM Percussion Club logo"
                width={64}
                height={64}
                className="h-12 w-12 object-contain"
              />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#666666]">
              Building rhythm, confidence and community through percussion.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <a
                href="https://instagram.com/iiumpercussionclub"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="IIUM Percussion Club on Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E8E8E8] text-[#666666] transition-colors duration-300 hover:border-[#C8A928] hover:text-[#C8A928]"
              >
                <InstagramIcon />
              </a>
              <a
                href="mailto:percussionclub@iium.edu.my"
                aria-label="Email IIUM Percussion Club"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E8E8E8] text-[#666666] transition-colors duration-300 hover:border-[#C8A928] hover:text-[#C8A928]"
              >
                <EmailIcon />
              </a>
            </div>
          </div>

          {/* Column 2 — Explore */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">
              Explore
            </h3>
            <ul className="mt-5 space-y-3">
              {EXPLORE_LINKS.map((link) => (
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
              {CONTACT_DETAILS.map((detail) => (
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
              © 2026 IIUM Percussion Club. All rights reserved.
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
