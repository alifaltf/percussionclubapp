import { notFound } from "next/navigation";
import Link from "next/link";
import PublicInstrumentView from "@/components/instruments/PublicInstrumentView";
import RequestToBorrowForm from "@/components/instruments/RequestToBorrowForm";
import Button from "@/components/ui/Button";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { getInstrumentByCode, getPublicInstrumentByCode } from "@/lib/supabase/instruments";
import { getMyOpenRequestForInstrument } from "@/lib/supabase/borrow-requests";
import { submitBorrowRequest } from "@/app/instruments/[id]/actions";
import { getSiteSettings } from "@/lib/supabase/settings";
import { DEFAULT_SITE_SETTINGS } from "@/types/settings";
import { BORROW_REQUEST_STATUS_LABELS } from "@/types/borrow-request";
import { INSTRUMENT_CODE_PATTERN, STATUS_UNAVAILABLE_REASONS } from "@/types/instrument";

interface PublicInstrumentPageProps {
  params: Promise<{ instrument_code: string }>;
}

/**
 * QR-scan landing page — /i/[instrument_code]. This is the ONLY route a
 * printed QR code ever points to. Deliberately keeps the logged-out and
 * authenticated code paths fully separate:
 *
 * - Logged-out visitors only ever go through getPublicInstrumentByCode,
 *   which calls the restricted `get_public_instrument_by_code` RPC — there
 *   is no code path here that can leak the full instrument row (id,
 *   notes, purchase info) or any borrowing/member data to an anonymous
 *   request.
 * - Authenticated members/admins go through getInstrumentByCode, the same
 *   RLS-gated query style used elsewhere in the app, and reuse the
 *   existing borrowing form/action untouched.
 */
export default async function PublicInstrumentPage({
  params,
}: PublicInstrumentPageProps) {
  const { instrument_code: rawCode } = await params;

  let code: string;
  try {
    code = decodeURIComponent(rawCode).trim().toLowerCase();
  } catch {
    notFound();
  }

  if (!INSTRUMENT_CODE_PATTERN.test(code)) {
    notFound();
  }

  const { user, profile } = await getCurrentUser();

  if (!user) {
    let instrument;
    try {
      instrument = await getPublicInstrumentByCode(code);
    } catch {
      notFound();
    }
    if (!instrument) {
      notFound();
    }

    return (
      <PublicInstrumentView instrument={instrument}>
        <p className="text-sm text-[#666666]">
          Log in with your club account to view full details and request to
          borrow this instrument.
        </p>
        <Button href="/login" className="mt-4">
          Login to Borrow
        </Button>
      </PublicInstrumentView>
    );
  }

  let instrument;
  try {
    instrument = await getInstrumentByCode(code);
  } catch {
    notFound();
  }
  if (!instrument) {
    notFound();
  }

  const isAdmin = profile?.role === "admin";
  const isAvailable = instrument.status === "available";
  const unavailableReason = STATUS_UNAVAILABLE_REASONS[instrument.status];

  const [openRequest, settings] = await Promise.all([
    getMyOpenRequestForInstrument(instrument.id),
    getSiteSettings().catch(() => DEFAULT_SITE_SETTINGS),
  ]);
  const borrowingEnabled = settings.allow_member_borrowing;
  const boundSubmit = submitBorrowRequest.bind(null, instrument.id);
  const encodedCode = encodeURIComponent(instrument.instrument_code);

  return (
    <PublicInstrumentView instrument={instrument}>
      <div className="space-y-5">
        <Link
          href={`/instruments/${instrument.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#C8A928] transition-colors duration-300 hover:text-[#9E8217]"
        >
          View Full Details →
        </Link>

        <div>
          {openRequest ? (
            <p className="text-sm text-[#666666]">
              You already have a request for this instrument —{" "}
              <span className="font-medium text-[#111111]">
                {BORROW_REQUEST_STATUS_LABELS[openRequest.status]}
              </span>
              .{" "}
              <Link
                href="/my-requests"
                className="font-medium text-[#C8A928] transition-colors duration-300 hover:text-[#9E8217]"
              >
                View My Requests →
              </Link>
            </p>
          ) : !borrowingEnabled ? (
            <p className="text-sm text-[#666666]">
              New borrow requests are currently disabled by the club admin.
            </p>
          ) : isAvailable ? (
            <RequestToBorrowForm action={boundSubmit} />
          ) : (
            <p className="text-sm text-[#666666]">
              {unavailableReason ?? "This instrument isn't available to borrow right now."}
            </p>
          )}
        </div>

        {isAdmin && (
          <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-[#E8E8E8] pt-5 text-sm">
            <Link
              href={`/admin/instruments/${instrument.id}/edit`}
              className="font-medium text-[#666666] transition-colors duration-300 hover:text-[#C8A928]"
            >
              Edit Instrument
            </Link>
            <Link
              href={`/admin/requests?q=${encodedCode}`}
              className="font-medium text-[#666666] transition-colors duration-300 hover:text-[#C8A928]"
            >
              View Borrowing History
            </Link>
            <Link
              href={`/admin/requests?q=${encodedCode}&status=active`}
              className="font-medium text-[#666666] transition-colors duration-300 hover:text-[#C8A928]"
            >
              View Current Borrowing
            </Link>
          </div>
        )}
      </div>
    </PublicInstrumentView>
  );
}
