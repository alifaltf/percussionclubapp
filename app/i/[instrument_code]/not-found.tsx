import Button from "@/components/ui/Button";
import { InstrumentIcon } from "@/components/ui/icons";

/**
 * Shown for an unknown code, a malformed code, or an archived instrument —
 * archived instruments intentionally look identical to "doesn't exist" here
 * so a QR label taken out of circulation never keeps working publicly.
 */
export default function PublicInstrumentNotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-[#F8F8F6] px-6 py-24 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full border border-[#E8E8E8] bg-white text-[#C8A928]">
        <InstrumentIcon className="h-6 w-6" />
      </span>
      <h1 className="mt-6 font-serif text-2xl font-semibold text-[#111111] sm:text-3xl">
        Instrument Not Found
      </h1>
      <p className="mt-2 max-w-sm text-sm text-[#666666]">
        This QR code doesn&apos;t match an active instrument in our inventory.
      </p>
      <Button href="/" variant="outline" className="mt-6">
        Go to Homepage
      </Button>
    </main>
  );
}
