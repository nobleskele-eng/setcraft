import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://lanelab.studio"),
  title: {
    default: "LaneLab — Swim Performance Studio",
    template: "%s | LaneLab",
  },
  description: "Design workouts, organize lanes, deliver deck sheets, plan seasons, and analyze races in one professional swim coaching workspace.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "https://lanelab.studio",
    siteName: "LaneLab",
    title: "LaneLab — Swim Performance Studio",
    description: "Workout design, lane planning, season calendars, deck sheets, and race intelligence in one coaching workspace.",
    images: [{ url: "/og-lanelab.png", width: 1200, height: 630, alt: "LaneLab swim performance studio" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "LaneLab — Swim Performance Studio",
    description: "A professional planning and race-intelligence workspace for competitive swimming.",
    images: ["/og-lanelab.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
