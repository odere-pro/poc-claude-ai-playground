import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ReportProvider } from "@/context/ReportContext";
import { AppHeader } from "@/components/organisms/AppHeader";
import { VoiceController } from "@/components/organisms/VoiceController";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Clauseguard — Know what you signed",
  description:
    "Upload an employment contract and get a streamed compliance report in your language, with every clause cited to a real legal article.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <ReportProvider>
          <AppHeader />
          <main className="flex-1">{children}</main>
          {/* Single voice mount per spec; gated by NEXT_PUBLIC_VOICE_ENABLED. */}
          <VoiceController />
        </ReportProvider>
      </body>
    </html>
  );
}
