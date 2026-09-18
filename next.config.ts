import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : undefined;

// Baseline security headers only — no Content-Security-Policy yet. This app
// hasn't had its inline-script/style and fetch-origin surface (Next.js
// hydration payloads, Tailwind's compiled output, next/font, Supabase's
// storage/API origins) audited closely enough to guarantee a CSP wouldn't
// break something, so that's deliberately left for a separate pass.
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  // uploadAvatar (app/profile/actions.ts) is the one image-upload path that
  // sends raw file bytes through a Server Action rather than uploading
  // client-side straight to Storage — every other bucket (instrument/event/
  // gallery/site-asset) bypasses this cap entirely. Next.js defaults Server
  // Action request bodies to 1MB, well under the approved 10MB avatar
  // limit (lib/upload-limits.ts), so this must be raised to match or avatar
  // uploads above ~1MB would fail at the framework level regardless of the
  // app's own size validation.
  experimental: {
    serverActions: {
      bodySizeLimit: "11mb",
    },
  },
  images: {
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: "https",
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/public/**",
          },
          {
            // Signed URLs for the private return-photos bucket.
            protocol: "https",
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/sign/**",
          },
        ]
      : [],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

export default nextConfig;
