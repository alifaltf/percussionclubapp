import { redirect } from "next/navigation";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import { InstrumentIcon } from "@/components/ui/icons";
import InstrumentBrowser from "@/components/instruments/InstrumentBrowser";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { getInstruments } from "@/lib/supabase/instruments";
import type { Instrument } from "@/types/instrument";

export default async function InstrumentsPage() {
  const { user } = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  let instruments: Instrument[] = [];
  let loadError = false;

  try {
    instruments = await getInstruments();
  } catch {
    loadError = true;
  }

  return (
    <main className="flex flex-1 flex-col bg-[#F8F8F6] px-6 py-16 sm:py-20">
      <div className="mx-auto w-full max-w-6xl">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C8A928]">
            Club Inventory
          </span>
          <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-[#111111] sm:text-4xl">
            Instruments
          </h1>
          <p className="mt-2 max-w-xl text-sm text-[#666666]">
            Browse the club&apos;s instruments, check availability and condition,
            and view details before requesting to borrow.
          </p>
        </div>

        <div className="mt-10">
          {loadError ? (
            <EmptyState
              icon={<InstrumentIcon className="h-5 w-5" />}
              title="Couldn't load instruments"
              description="Something went wrong while fetching the inventory. Please try again."
              action={
                <Button href="/instruments" variant="outline">
                  Try Again
                </Button>
              }
            />
          ) : instruments.length === 0 ? (
            <EmptyState
              icon={<InstrumentIcon className="h-5 w-5" />}
              title="No instruments yet"
              description="Instruments added to the club inventory will appear here."
            />
          ) : (
            <InstrumentBrowser instruments={instruments} />
          )}
        </div>
      </div>
    </main>
  );
}
