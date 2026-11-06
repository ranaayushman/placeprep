import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Inter is the logo's typeface; the mono is only for exam timers and question numbers.
const sans = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jbmono" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "https://placeprep.me"),
  title: { default: "PlacePrep — Infosys SE mock tests & practice", template: "%s · PlacePrep" },
  description: "Aptitude and MCQ practice for the Infosys Systems Engineer online assessment. Coding-question practice is not provided.",
  openGraph: { siteName: "PlacePrep", type: "website", images: ["/placeprep-logo.png"] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
