"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Button from "@/components/ui/Button";

interface FormValues {
  fullName: string;
  email: string;
  subject: string;
  message: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  subject?: string;
  message?: string;
}

type SubmitStatus = "idle" | "submitting" | "success";

const INITIAL_VALUES: FormValues = {
  fullName: "",
  email: "",
  subject: "",
  message: "",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.fullName.trim()) {
    errors.fullName = "Please enter your full name.";
  } else if (values.fullName.trim().length < 2) {
    errors.fullName = "Name must be at least 2 characters.";
  }

  if (!values.email.trim()) {
    errors.email = "Please enter your email address.";
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = "Please enter a valid email address.";
  }

  if (!values.subject.trim()) {
    errors.subject = "Please enter a subject.";
  }

  if (!values.message.trim()) {
    errors.message = "Please enter a message.";
  } else if (values.message.trim().length < 10) {
    errors.message = "Message should be at least 10 characters.";
  }

  return errors;
}

const FIELD_BASE_STYLES =
  "w-full rounded-sm border bg-white px-4 py-2.5 text-sm text-[#111111] transition-colors duration-300 placeholder:text-[#666666] focus:outline-none focus:ring-1";

function fieldStyles(hasError: boolean) {
  return `${FIELD_BASE_STYLES} ${
    hasError
      ? "border-red-300 focus:border-red-400 focus:ring-red-300"
      : "border-[#E8E8E8] focus:border-[#C8A928] focus:ring-[#C8A928]"
  }`;
}

export default function ContactForm() {
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<SubmitStatus>("idle");

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationErrors = validate(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setStatus("submitting");

    // Temporary placeholder submission — not yet connected to Supabase.
    setTimeout(() => {
      setStatus("success");
      setValues(INITIAL_VALUES);
    }, 600);
  };

  const handleReset = () => {
    setStatus("idle");
    setErrors({});
  };

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center rounded-sm border border-[#E8E8E8] bg-white px-6 py-16 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[#C8A928] text-[#C8A928]">
          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path
              d="M5 13l4 4L19 7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <h3 className="mt-5 font-serif text-xl font-semibold text-[#111111]">
          Message Sent
        </h3>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#666666]">
          Thank you for reaching out — we&apos;ll get back to you soon.
        </p>
        <button
          type="button"
          onClick={handleReset}
          className="mt-6 text-sm font-medium text-[#C8A928] transition-colors duration-300 hover:text-[#9E8217]"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="fullName"
          className="mb-2 block text-sm font-medium text-[#111111]"
        >
          Full Name
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          value={values.fullName}
          onChange={handleChange}
          aria-invalid={Boolean(errors.fullName)}
          aria-describedby={errors.fullName ? "fullName-error" : undefined}
          className={fieldStyles(Boolean(errors.fullName))}
        />
        {errors.fullName && (
          <p id="fullName-error" className="mt-1.5 text-xs text-red-600">
            {errors.fullName}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-sm font-medium text-[#111111]"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={handleChange}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
          className={fieldStyles(Boolean(errors.email))}
        />
        {errors.email && (
          <p id="email-error" className="mt-1.5 text-xs text-red-600">
            {errors.email}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="subject"
          className="mb-2 block text-sm font-medium text-[#111111]"
        >
          Subject
        </label>
        <input
          id="subject"
          name="subject"
          type="text"
          value={values.subject}
          onChange={handleChange}
          aria-invalid={Boolean(errors.subject)}
          aria-describedby={errors.subject ? "subject-error" : undefined}
          className={fieldStyles(Boolean(errors.subject))}
        />
        {errors.subject && (
          <p id="subject-error" className="mt-1.5 text-xs text-red-600">
            {errors.subject}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="message"
          className="mb-2 block text-sm font-medium text-[#111111]"
        >
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          value={values.message}
          onChange={handleChange}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "message-error" : undefined}
          className={`${fieldStyles(Boolean(errors.message))} resize-none`}
        />
        {errors.message && (
          <p id="message-error" className="mt-1.5 text-xs text-red-600">
            {errors.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        variant="primary"
        disabled={status === "submitting"}
        className="w-full sm:w-auto"
      >
        {status === "submitting" ? "Sending..." : "Send Message"}
      </Button>
    </form>
  );
}
