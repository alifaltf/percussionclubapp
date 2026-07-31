"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { updateProfile, type ProfileFormState } from "@/app/profile/actions";

const INITIAL_STATE: ProfileFormState = { status: "idle", message: null };

const FIELD_STYLES =
  "w-full rounded-sm border border-[#E8E8E8] bg-white px-4 py-2.5 text-sm text-[#111111] transition-colors duration-300 placeholder:text-[#666666] focus:outline-none focus:border-[#C8A928] focus:ring-1 focus:ring-[#C8A928]";

const READONLY_FIELD_STYLES =
  "w-full rounded-sm border border-[#E8E8E8] bg-[#F8F8F6] px-4 py-2.5 text-sm text-[#666666]";

interface ProfileDetailsFormProps {
  email: string;
  isAdmin: boolean;
  initialFullName: string;
  initialPhone: string;
}

export default function ProfileDetailsForm({
  email,
  isAdmin,
  initialFullName,
  initialPhone,
}: ProfileDetailsFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    updateProfile,
    INITIAL_STATE,
  );

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [state.status, router]);

  return (
    <form action={formAction} className="space-y-6">
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
          defaultValue={initialFullName}
          required
          className={FIELD_STYLES}
        />
      </div>

      <div>
        <label
          htmlFor="phone"
          className="mb-2 block text-sm font-medium text-[#111111]"
        >
          Phone
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={initialPhone}
          placeholder="e.g. 012-345 6789"
          className={FIELD_STYLES}
        />
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
          type="email"
          value={email}
          disabled
          readOnly
          className={READONLY_FIELD_STYLES}
        />
        <p className="mt-1.5 text-xs text-[#666666]">
          Email cannot be changed here.
        </p>
      </div>

      <div>
        <span className="mb-2 block text-sm font-medium text-[#111111]">
          Role
        </span>
        <Badge variant={isAdmin ? "gold" : "default"}>
          {isAdmin ? "Admin" : "Member"}
        </Badge>
      </div>

      <div aria-live="polite">
        {state.status === "error" && state.message && (
          <p role="alert" className="text-sm text-red-600">
            {state.message}
          </p>
        )}
        {state.status === "success" && state.message && (
          <p className="text-sm text-[#9E8217]">{state.message}</p>
        )}
      </div>

      <Button type="submit" variant="primary" disabled={isPending}>
        {isPending ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
