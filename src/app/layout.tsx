import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "MoveMate AI — Voice-Powered Moving Assistant",
  description:
    "Book your moving service naturally using voice. Tell MoveMate AI what you need to move, where, and when — and get a structured booking summary instantly.",
  keywords: ["moving service", "AI booking", "voice assistant", "transportation"],
  openGraph: {
    title: "MoveMate AI",
    description: "Your voice-powered moving assistant",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
