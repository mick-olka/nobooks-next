import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import {
  BuyMeACoffee,
  FixedAnnouncement,
  LayoutFooter,
  LayoutHeader,
} from "./components";
import { AnimatePresence } from "framer-motion";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "no boobs",
  description: "no boobs",
  icons: {
    icon: "/favicon.ico",
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
        <AnimatePresence mode="wait">
          <div className="h-screen overflow-x-hidden">
            <LayoutHeader />
            <main className="min-h-full bg-base-200">{children}</main>
            <LayoutFooter />

            <FixedAnnouncement message="v1.21-1.21.4" />
          </div>
        </AnimatePresence>
        <BuyMeACoffee />
      </body>
    </html>
  );
}
