import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { ReportProvider } from "@/context/ReportContext";
import { AppHeader } from "@/components/organisms/AppHeader";
import { VoiceController } from "@/components/organisms/VoiceController";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/lib/types";

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

function isSupportedLang(value: string | undefined): value is SupportedLanguage {
  return !!value && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // SSR language: use the persisted cookie if present, otherwise "en".
  // The client-side languageDetector cascade refines this on mount and
  // can write back to the cookie later for SSR consistency.
  const cookieStore = await cookies();
  const stored = cookieStore.get("clauseguard.lang")?.value;
  const lang: SupportedLanguage = isSupportedLang(stored) ? stored : "en";
  return (
    <html lang={lang} className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
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
