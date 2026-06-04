import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navigation from "@/components/Navigation";
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
  metadataBase: new URL("https://charlenemckeown.com"),
  title: {
    default: "Charlene McKeown Photography",
    template: "%s — Charlene McKeown Photography",
  },
  description: "A photography portfolio",
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
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Navigation />

        <main className="flex-1">{children}</main>

        <footer className="border-t border-neutral-200 dark:border-neutral-800">
          <div className="mx-auto max-w-5xl px-6 py-6 text-sm text-neutral-500">
            &copy; {new Date().getFullYear()} Charlene McKeown Photography
          </div>
        </footer>
      </body>
    </html>
  );
}
