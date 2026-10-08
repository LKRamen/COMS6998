import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Been there · Every trip has a caption",
  description:
    "Share travel photos, generate AI captions, and rate the moments that land. Explore our shared travel atlas.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
