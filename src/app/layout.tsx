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
  title: {
    default: "Poolr",
    template: "%s | Poolr",
  },
  description:
    "Create and join private pools for football, bingo, F1 and more.",
  applicationName: "Poolr",
  icons: {
    icon: "/brand/poolr-icon.png",
    shortcut: "/brand/poolr-icon.png",
    apple: "/brand/poolr-icon.png",
  },
  openGraph: {
    title: "Poolr",
    description:
      "Create and join private pools for football, bingo, F1 and more.",
    siteName: "Poolr",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}