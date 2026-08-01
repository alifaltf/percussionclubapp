import type { InputHTMLAttributes } from "react";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export default function FormField({
  label,
  id,
  name,
  className = "",
  ...rest
}: FormFieldProps) {
  const fieldId = id ?? name;

  return (
    <div>
      <label
        htmlFor={fieldId}
        className="text-xs font-medium uppercase tracking-wide text-[#666666]"
      >
        {label}
      </label>
      <input
        id={fieldId}
        name={name}
        className={`mt-1.5 w-full rounded-sm border border-[#E8E8E8] px-3 py-2 text-sm text-[#111111] focus:border-[#C8A928] focus:outline-none disabled:cursor-not-allowed disabled:bg-[#F8F8F6] disabled:text-[#666666] ${className}`}
        {...rest}
      />
    </div>
  );
}
