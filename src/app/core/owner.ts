/**
 * Owner / developer of this demo: Mavix Tech.
 * Single source of the credit copy, link and logo paths used by the login page, landing footer,
 * dashboard sidebar badge and About dialog. Logos are self-hosted under public/brand/mavix/ and
 * referenced relative to <base href>, so they work on GitHub Pages sub-paths and pass `img-src 'self'`.
 */
export const OWNER = {
  name: 'Mavix Tech',
  tagline: 'Systems · Automation · Graduation Projects',
  description: 'Custom business systems, workflow automation and complete graduation projects. ASP.NET, Angular, SQL Server.',
  cta: "Have an idea? Let's build it.",
  url: 'https://mavixtechma-ship-it.github.io/Mavix/',
  /** Wordmark for light backgrounds. */
  logo: 'brand/mavix/mavix-logo.svg',
  /** Wordmark for dark backgrounds. */
  logoDark: 'brand/mavix/mavix-logo-white.svg',
  /** Icon only, for light backgrounds. */
  mark: 'brand/mavix/mavix-mark.svg',
  /** Icon only, for dark backgrounds. */
  markDark: 'brand/mavix/mavix-mark-white.svg',
} as const;
