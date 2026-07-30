"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Button from "@/components/ui/Button";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Gallery", href: "/gallery" },
  { label: "Events", href: "/events" },
  { label: "Committee", href: "/committee" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

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

        {/* Desktop login button */}
        <div className="hidden md:block">
          <Button href="/login" variant="primary">
            Login
          </Button>
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
          isOpen ? "max-h-96 border-t border-[#E8E8E8]" : "max-h-0"
        }`}
      >
        <ul className="flex flex-col gap-1 px-6 py-4">
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
            <Button
              href="/login"
              variant="primary"
              className="w-full"
              onClick={() => setIsOpen(false)}
            >
              Login
            </Button>
          </li>
        </ul>
      </div>
    </header>
  );
}
