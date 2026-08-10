import Link from "next/link";
import type { ButtonHTMLAttributes, MouseEventHandler, ReactNode } from "react";

type ButtonVariant = "primary" | "outline";

interface ButtonProps {
  children: ReactNode;
  href?: string;
  variant?: ButtonVariant;
  className?: string;
  onClick?: MouseEventHandler;
  type?: ButtonHTMLAttributes<HTMLButtonElement>["type"];
  disabled?: boolean;
  /** Only used when `href` is set, e.g. "_blank" for external links. */
  target?: string;
  rel?: string;
}

// Reads the --brand-primary / --brand-accent CSS custom properties (set
// per-request in app/layout.tsx from site_settings) rather than hardcoded
// hex values, so an admin's branding change applies everywhere this button
// is used. Defaults to the club's white/black/gold identity if the
// variables are ever unset — see the :root fallback in app/globals.css.
const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary: "bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-accent)]",
  outline:
    "border border-[var(--brand-primary)] text-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-white",
};

export default function Button({
  children,
  href,
  variant = "primary",
  className = "",
  onClick,
  type = "button",
  disabled = false,
  target,
  rel,
}: ButtonProps) {
  const styles = `inline-flex items-center justify-center rounded-sm px-5 py-2 text-sm font-medium tracking-wide transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-60 ${VARIANT_STYLES[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={styles} onClick={onClick} target={target} rel={rel}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={styles}>
      {children}
    </button>
  );
}
