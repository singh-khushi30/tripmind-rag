import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";

import { Footer, Header, Main } from "@/components/layout";

import "@/styles/globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: {
    default: "TripMind",
    template: "%s · TripMind",
  },
  description:
    "Personalized AI travel planning with budget-aware itineraries tailored to your style and pace.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full`}
    >
      <body className="text-foreground flex min-h-full flex-col font-sans">
        <Header />
        <Main>{children}</Main>
        <Footer />
      </body>
    </html>
  );
}
