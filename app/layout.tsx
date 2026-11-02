import type { Metadata } from "next";
import { Instrument_Sans, Instrument_Serif, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const sans    = Instrument_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const display = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-display", display: "swap" });
const mono    = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Neo — Personal Market Intelligence",
  description:
    "Neo combines your news, newsletters, podcasts and feeds into one morning briefing, written for who you are and what you're working on.",
  openGraph: {
    title: "Neo — Personal Market Intelligence",
    description: "One morning briefing from all your sources, through your own lens.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable} ${mono.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
