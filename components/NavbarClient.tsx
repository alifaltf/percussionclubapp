"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ProfileDropdown from "@/components/ui/ProfileDropdown";
import { logout } from "@/lib/supabase/actions";
import { getInitials } from "@/utils/get-initials";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Gallery", href: "/gallery" },
  { label: "Events", href: "/events" },
  { label: "Committee", href: "/committee" },
  { label: "Contact", href: "/#contact" },
];

const MEMBER_MENU_ITEMS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "My Borrowings", href: "/my-borrowings" },
  { label: "Profile", href: "/profile" },
];

const ADMIN_MENU_ITEMS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Admin Panel", href: "/admin" },
  { label: "Members", href: "/admin/members" },
  { label: "Instruments", href: "/admin/instruments" },
  { label: "Profile", href: "/profile" },
];

interface NavbarClientProps {
  isAuthenticated: boolean;
  isAdmin?: boolean;
  displayName?: string;
  avatarUrl?: string;
}

export default function NavbarClient({
  isAuthenticated,
  isAdmin = false,
  displayName = "Member",
  avatarUrl,
}: NavbarClientProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuItems = isAdmin ? ADMIN_MENU_ITEMS : MEMBER_MENU_ITEMS;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E8E8E8] bg-white">
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center"
          onClick={() => setIsOpen(false)}
        >
          <Image
            src="/images/percussion-club-logo.jpg"
            alt="IIUM Percussion Club logo"
            width={64}
            height={64}
            priority
            className="h-10 w-10 object-contain"
          />
        </Link>

        {/* Desktop links */}
        <ul className="hidden items-center gap-10 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="group relative text-sm font-medium tracking-wide text-[#111111] transition-colors duration-300 hover:text-[#C8A928]"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 h-px w-0 bg-[#C8A928] transition-all duration-300 ease-out group-hover:w-full" />
              </Link>
            </li>
          ))}
        </ul>

        {/* Desktop auth area */}
        <div className="hidden md:block">
          {isAuthenticated ? (
            <ProfileDropdown
              displayName={displayName}
              avatarUrl={avatarUrl}
              isAdmin={isAdmin}
              menuItems={menuItems}
            />
          ) : (
            <Button href="/login" variant="primary">
              Login
            </Button>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex h-10 w-10 items-center justify-center md:hidden"
          aria-label="Toggle menu"
          aria-expanded={isOpen}
        >
          <span className="relative flex h-4 w-6 flex-col justify-between">
            <span
              className={`h-px w-full bg-[#111111] transition-transform duration-300 ${
                isOpen ? "translate-y-[7px] rotate-45" : ""
              }`}
            />
            <span
              className={`h-px w-full bg-[#111111] transition-opacity duration-300 ${
                isOpen ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`h-px w-full bg-[#111111] transition-transform duration-300 ${
                isOpen ? "-translate-y-[7px] -rotate-45" : ""
              }`}
            />
          </span>
        </button>
      </nav>

      {/* Mobile menu */}
      <div
        className={`overflow-hidden bg-white transition-[max-height] duration-300 ease-in-out md:hidden ${
          isOpen ? "max-h-[42rem] border-t border-[#E8E8E8]" : "max-h-0"
        }`}
      >
        <ul className="flex max-h-[calc(100vh-5rem)] flex-col gap-1 overflow-y-auto px-6 py-4">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block py-3 text-sm font-medium tracking-wide text-[#111111] transition-colors duration-300 hover:text-[#C8A928]"
              >
                {link.label}
              </Link>
            </li>
          ))}

          <li className="pt-2 pb-1">
            {isAuthenticated ? (
              <div className="space-y-1 border-t border-[#E8E8E8] pt-4">
                <div className="flex items-center gap-3 px-1 pb-2">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#E8E8E8] bg-[#F8F8F6] text-xs font-semibold text-[#111111]">
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt={displayName}
                        width={36}
                        height={36}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      getInitials(displayName)
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#111111]">
                      {displayName}
                    </p>
                    <Badge
                      variant={isAdmin ? "gold" : "default"}
                      className="mt-1"
                    >
                      {isAdmin ? "Admin" : "Member"}
                    </Badge>
                  </div>
                </div>

                {menuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="block rounded-lg px-2 py-2.5 text-sm text-[#111111] transition-colors duration-300 hover:bg-[#F8F8F6] hover:text-[#C8A928]"
                  >
                    {item.label}
                  </Link>
                ))}

                <form action={logout}>
                  <button
                    type="submit"
                    className="block w-full rounded-lg px-2 py-2.5 text-left text-sm text-[#111111] transition-colors duration-300 hover:bg-[#F8F8F6] hover:text-[#C8A928]"
                  >
                    Logout
                  </button>
                </form>
              </div>
            ) : (
              <Button
                href="/login"
                variant="primary"
                className="w-full"
                onClick={() => setIsOpen(false)}
              >
                Login
              </Button>
            )}
          </li>
        </ul>
      </div>
    </header>
  );
}
