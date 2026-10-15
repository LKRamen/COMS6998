import type { Metadata } from "next";
import { Suspense } from "react";

import "./globals.css";
import "./brainrot.css";
import VoteNavigationRefresh from "./components/vote-navigation-refresh";

export const metadata: Metadata = {
  title: { default: "Brainrot · Your brain. Off duty.", template: "%s · Brainrot" },
  description:
    "Turn your camera roll into comedy. Create AI memes, swipe your honest opinion, and discover your kind of funny.",
  metadataBase: new URL("https://coms-6998-theta.vercel.app"),
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><Suspense fallback={null}><VoteNavigationRefresh/></Suspense>{children}</body>
    </html>
  );
}
