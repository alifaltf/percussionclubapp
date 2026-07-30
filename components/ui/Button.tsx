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
}

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary: "bg-[#C8A928] text-white hover:bg-[#9E8217]",
  outline:
    "border border-[#C8A928] text-[#C8A928] hover:bg-[#C8A928] hover:text-white",
};

export default function Button({
  children,
  href,
  variant = "primary",
  className = "",
  onClick,
  type = "button",
}: ButtonProps) {
  const styles = `inline-flex items-center justify-center rounded-sm px-5 py-2 text-sm font-medium tracking-wide transition-colors duration-300 ${VARIANT_STYLES[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={styles} onClick={onClick}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={styles}>
      {children}
    </button>
  );
}
