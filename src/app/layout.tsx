import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Inter is the logo's typeface; the mono is only for exam timers and question numbers.
const sans = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jbmono" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "https://placeprep.me"),
  title: { default: "PlacePrep | Infosys Placement Aptitude & MCQ Practice", template: "%s | PlacePrep" },
  description:
    "Prepare for Infosys and Deloitte placements with free aptitude and MCQ practice, mock tests, topic drills, and worked explanations. Coding-question practice is not provided.",
  applicationName: "PlacePrep",
  keywords: [
    "Infosys placement preparation",
    "Infosys aptitude test",
    "Infosys online assessment",
    "Infosys placement questions",
    "Deloitte placement preparation",
    "Deloitte aptitude test",
    "Deloitte placement questions",
    "placement aptitude practice",
    "placement MCQ practice",
    "aptitude mock test",
  ],
  alternates: { canonical: "/" },
  icons: { icon: "/placeprep-icon.png", apple: "/placeprep-icon.png" },
  openGraph: {
    siteName: "PlacePrep",
    type: "website",
    url: "/",
    title: "PlacePrep | Infosys Placement Aptitude & MCQ Practice",
    description: "Free aptitude and MCQ practice for Infosys placement preparation and placement drives.",
    images: [{ url: "/placeprep-logo.png", width: 1200, height: 630, alt: "PlacePrep placement aptitude practice" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "PlacePrep | Infosys Placement Aptitude & MCQ Practice",
    description: "Free aptitude and MCQ practice for Infosys placement preparation.",
    images: ["/placeprep-logo.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
