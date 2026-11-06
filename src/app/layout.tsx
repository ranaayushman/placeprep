import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { CookieConsent } from "@/components/CookieConsent";
import "./globals.css";

// Inter is the logo's typeface; the mono is only for exam timers and question numbers.
const sans = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jbmono" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "https://placeprep.me"),
  title: { default: "PlacePrep | Free Placement Aptitude & MCQ Practice", template: "%s | PlacePrep" },
  description:
    "Free aptitude and MCQ practice, proctored mock tests, topic drills, and worked explanations for campus placement drives.",
  applicationName: "PlacePrep",
  keywords: [
    "placement aptitude practice",
    "placement MCQ practice",
    "aptitude mock test",
    "Infosys placement preparation",
    "Deloitte placement preparation",
    "Infosys aptitude test",
    "Deloitte aptitude test",
  ],
  alternates: { canonical: "/" },
  icons: { icon: "/placeprep-icon.png", apple: "/placeprep-icon.png" },
  openGraph: {
    siteName: "PlacePrep",
    type: "website",
    url: "/",
    title: "PlacePrep | Free Placement Aptitude & MCQ Practice",
    description: "Free aptitude and MCQ practice for campus placement preparation and hiring drives.",
    images: [{ url: "/placeprep-logo.png", width: 1200, height: 630, alt: "PlacePrep placement aptitude practice" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "PlacePrep | Free Placement Aptitude & MCQ Practice",
    description: "Free aptitude and MCQ practice for campus placement preparation.",
    images: ["/placeprep-logo.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
