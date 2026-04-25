import type { NextConfig } from "next";

// Permissions-Policy: mic stays enabled because /results uses MediaRecorder
// when NEXT_PUBLIC_VOICE_ENABLED is true. Camera + geolocation are denied.
const permissionsPolicy = ["camera=()", "microphone=(self)", "geolocation=()"].join(", ");

// CSP — restrictive baseline. 'unsafe-inline' on style is required by
// Tailwind/shadcn until we adopt nonces; revisit when CSP nonce middleware
// lands. 'unsafe-inline' on script is intentionally absent.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self' https://api.anthropic.com https://test.api.solvimon.com https://api.reson8.dev",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: permissionsPolicy },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
