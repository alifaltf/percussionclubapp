import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import { EmailIcon } from "@/components/ui/icons";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { getContactMessages } from "@/lib/supabase/contact";
import type { ContactMessage } from "@/types/contact";

// Explicit timeZone: this Server Component renders on the server, whose
// own local timezone is not guaranteed to be Malaysia's (it's UTC in this
// deployment) — without this, admins would see created_at shifted by the
// server's offset from Malaysia (Asia/Kuala_Lumpur, UTC+8, no DST) rather
// than the actual local time a message arrived. Storage stays UTC; only
// this display formatting is timezone-aware.
const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Kuala_Lumpur",
});

export default async function AdminMessagesPage() {
  await requireAdmin();

  let messages: ContactMessage[] = [];
  let loadError = false;

  try {
    messages = await getContactMessages();
  } catch {
    loadError = true;
  }

  return (
    <main className="flex flex-1 flex-col bg-[#F8F8F6] px-6 py-16 sm:py-20">
      <div className="mx-auto w-full max-w-4xl">
        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C8A928]">
          Admin
        </span>
        <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-[#111111] sm:text-4xl">
          Contact Messages
        </h1>
        <p className="mt-2 max-w-xl text-sm text-[#666666]">
          Submissions from the public contact form, newest first.
        </p>

        <div className="mt-10">
          {loadError ? (
            <EmptyState
              icon={<EmailIcon className="h-5 w-5" />}
              title="Couldn't load messages"
              description="Something went wrong while fetching contact messages. Please try again."
              action={
                <Button href="/admin/messages" variant="outline">
                  Try Again
                </Button>
              }
            />
          ) : messages.length === 0 ? (
            <EmptyState
              icon={<EmailIcon className="h-5 w-5" />}
              title="No messages yet"
              description="Submissions from the public contact form will appear here."
            />
          ) : (
            <ul className="space-y-4">
              {messages.map((message) => (
                <li
                  key={message.id}
                  className="rounded-2xl border border-[#E8E8E8] bg-white p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-serif text-base font-semibold text-[#111111]">
                        {message.full_name}
                      </p>
                      <a
                        href={`mailto:${message.email}`}
                        className="break-all text-sm text-[#C8A928] transition-colors duration-300 hover:text-[#9E8217]"
                      >
                        {message.email}
                      </a>
                    </div>
                    <span className="shrink-0 text-xs text-[#666666]">
                      {DATE_FORMATTER.format(new Date(message.created_at))}
                    </span>
                  </div>

                  <p className="mt-3 text-sm font-semibold text-[#111111]">
                    {message.subject && message.subject.trim() !== ""
                      ? message.subject
                      : "No subject"}
                  </p>

                  <p className="mt-2 whitespace-pre-wrap break-words text-sm text-[#666666]">
                    {message.message}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
