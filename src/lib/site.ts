import type { Metadata } from "next";

/**
 * Public URL for SEO (canonical tags, sitemap, robots). Kept apart from APP_URL, which also builds
 * the Google sign-in callback and must match what is registered in the Google console.
 */
export const SITE_URL = process.env.SITE_URL ?? "https://www.placeprep.me";

/** Shared Open Graph tags. Pages that set their own openGraph must spread this: Next.js replaces it whole. */
export const OPEN_GRAPH = {
  siteName: "PlacePrep",
  type: "website",
  title: "PlacePrep | Free Placement Aptitude & MCQ Practice",
  description: "Free aptitude and MCQ practice for campus placement preparation and hiring drives.",
  images: [{ url: "/placeprep-logo.png", width: 1200, height: 630, alt: "PlacePrep placement aptitude practice" }],
} satisfies Metadata["openGraph"];
