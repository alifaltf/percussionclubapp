"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { logout } from "@/lib/supabase/actions";
import { getInitials } from "@/utils/get-initials";

interface MenuItem {
  label: string;
  href: string;
}

interface ProfileDropdownProps {
  displayName: string;
  avatarUrl?: string;
  menuItems: MenuItem[];
}

export default function ProfileDropdown({
  displayName,
  avatarUrl,
  menuItems,
}: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const initials = getInitials(displayName);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3 text-sm font-medium text-[#111111] transition-colors duration-300 hover:text-[#C8A928]"
      >
        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#E8E8E8] bg-[#F8F8F6] text-xs font-semibold text-[#111111]">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              fill
              sizes="36px"
              className="object-cover"
            />
          ) : (
            initials
          )}
        </span>
        <span className="max-w-[9rem] truncate">{displayName}</span>
        <svg
          viewBox="0 0 24 24"
          className={`h-3.5 w-3.5 text-[#666666] transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div
        role="menu"
        className={`absolute right-0 top-full mt-2 w-56 origin-top-right rounded-xl border border-[#E8E8E8] bg-white p-2 shadow-sm transition-all duration-200 ease-out ${
          isOpen
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-1 opacity-0"
        }`}
      >
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            role="menuitem"
            onClick={() => setIsOpen(false)}
            className="block rounded-lg px-3 py-2 text-sm text-[#111111] transition-colors duration-300 hover:bg-[#F8F8F6] hover:text-[#C8A928]"
          >
            {item.label}
          </Link>
        ))}

        <div className="my-2 border-t border-[#E8E8E8]" />

        <form action={logout}>
          <button
            type="submit"
            role="menuitem"
            className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[#111111] transition-colors duration-300 hover:bg-[#F8F8F6] hover:text-[#C8A928]"
          >
            Logout
          </button>
        </form>
      </div>
    </div>
  );
}
