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
  title: "IPO Tracker India - Upcoming IPOs with Expert Verdicts",
  description:
    "Track upcoming Indian IPOs with Grey Market Premium (GMP), subscription status, and expert opinions from top finance YouTubers like Anil Singhvi, CA Rachana Ranade, and more.",
  keywords: [
    "IPO",
    "Indian IPO",
    "upcoming IPO",
    "IPO GMP",
    "grey market premium",
    "IPO review",
    "IPO tracker",
  ],
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
