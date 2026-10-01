import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Been there · A shared travel atlas",
  description:
    "Map the countries you have visited and explore the places our community has been.",
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
