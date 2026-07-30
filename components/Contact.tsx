import ContactForm from "@/components/ContactForm";
import Reveal from "@/components/ui/Reveal";
import {
  ClockIcon,
  EmailIcon,
  InstagramIcon,
  LocationIcon,
  WhatsAppIcon,
} from "@/components/ui/icons";

const CONTACT_DETAILS = [
  {
    icon: EmailIcon,
    label: "Email",
    value: "percussionclub@iium.edu.my",
    href: "mailto:percussionclub@iium.edu.my",
  },
  {
    icon: InstagramIcon,
    label: "Instagram",
    value: "@iiumpercussionclub",
    href: "https://instagram.com/iiumpercussionclub",
  },
  {
    icon: WhatsAppIcon,
    label: "WhatsApp",
    value: "+60 12-345 6789",
    href: "https://wa.me/60123456789",
  },
  {
    icon: LocationIcon,
    label: "Location",
    value: "International Islamic University Malaysia",
    href: undefined,
  },
  {
    icon: ClockIcon,
    label: "Rehearsal",
    value: "Every Friday, 8:00 PM",
    href: undefined,
  },
] as const;

export default function Contact() {
  return (
    <section id="contact" className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C8A928]">
            Get in Touch
          </span>
          <h2 className="mt-4 font-serif text-4xl font-semibold tracking-tight text-[#111111] sm:text-5xl">
            Let&apos;s Connect
          </h2>
          <p className="mt-6 text-base leading-relaxed text-[#666666] sm:text-lg">
            Interested in joining the club, inviting us to perform or
            collaborating with us? Reach out and we&apos;ll get back to you.
          </p>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-20">
          {/* Left column — contact details */}
          <Reveal delayMs={100}>
            <p className="text-base leading-relaxed text-[#666666]">
              Whether you&apos;re a student, a fellow performer or an event
              organiser — we&apos;d love to hear from you.
            </p>

            <ul className="mt-8 space-y-6">
              {CONTACT_DETAILS.map((detail) => {
                const Icon = detail.icon;
                const isExternal = detail.href?.startsWith("http");

                return (
                  <li key={detail.label}>
                    {detail.href ? (
                      <a
                        href={detail.href}
                        target={isExternal ? "_blank" : undefined}
                        rel={isExternal ? "noopener noreferrer" : undefined}
                        className="group flex items-start gap-4"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E8E8E8] text-[#C8A928] transition-colors duration-300 group-hover:border-[#C8A928]">
                          <Icon />
                        </span>
                        <span>
                          <span className="block text-sm font-semibold text-[#111111] transition-colors duration-300 group-hover:text-[#C8A928]">
                            {detail.label}
                          </span>
                          <span className="block text-sm text-[#666666]">
                            {detail.value}
                          </span>
                        </span>
                      </a>
                    ) : (
                      <div className="flex items-start gap-4">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E8E8E8] text-[#C8A928]">
                          <Icon />
                        </span>
                        <span>
                          <span className="block text-sm font-semibold text-[#111111]">
                            {detail.label}
                          </span>
                          <span className="block text-sm text-[#666666]">
                            {detail.value}
                          </span>
                        </span>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </Reveal>

          {/* Right column — contact form */}
          <Reveal delayMs={200}>
            <ContactForm />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
