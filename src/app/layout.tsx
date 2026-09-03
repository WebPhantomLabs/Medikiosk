import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "MediKiosk - AI-Powered Clinical Intake System",
  description: "Revolutionizing OPD patient check-ins with intelligent voice assistance, document digitization, and ABDM integration",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
