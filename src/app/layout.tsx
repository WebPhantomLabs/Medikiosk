import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Inter, Noto_Sans_Devanagari, Noto_Sans_Tamil, Noto_Sans_Bengali, Noto_Sans_Telugu } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  display: "swap",
  variable: "--font-devanagari",
  weight: ["400", "500", "600", "700"],
});

const notoTamil = Noto_Sans_Tamil({
  subsets: ["tamil"],
  display: "swap",
  variable: "--font-tamil",
  weight: ["400", "500", "600", "700"],
});

const notoBengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  display: "swap",
  variable: "--font-bengali",
  weight: ["400", "500", "600", "700"],
});

const notoTelugu = Noto_Sans_Telugu({
  subsets: ["telugu"],
  display: "swap",
  variable: "--font-telugu",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "MediKiosk — Smart Healthcare Check-in",
  description:
    "AI-powered clinical intake kiosk for modern hospitals. Voice-first, multilingual, accessible.",
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="light"
      className={`${inter.variable} ${notoDevanagari.variable} ${notoTamil.variable} ${notoBengali.variable} ${notoTelugu.variable}`}
      suppressHydrationWarning
    >
      <body
        className="font-[family-name:var(--font-inter)] antialiased bg-[var(--mk-bg)] text-[var(--mk-text)]"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
