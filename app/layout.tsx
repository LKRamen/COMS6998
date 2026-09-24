import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Countries by Population",
  description:
    "The 15 most populous countries, ranked by 2026 population estimates.",
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
