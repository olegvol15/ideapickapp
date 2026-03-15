import type { NextConfig } from 'next';

// CSP is intentionally absent here — it is generated per-request in
// middleware.ts so that a unique nonce can be embedded in each response.
const securityHeaders = [
  // Enforce HTTPS for 1 year, include subdomains.
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  // Prevent MIME-type sniffing.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Block the page from being embedded in iframes.
  { key: 'X-Frame-Options', value: 'DENY' },
  // Trim referrer to origin only for cross-origin requests.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Disable browser features the app doesn't use.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
