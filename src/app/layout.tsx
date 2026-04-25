import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono, Playfair_Display } from "next/font/google";
import { ReportProvider } from "@/context/ReportContext";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Clauseguard",
  description:
    "Know your rights. Paste your employment contract — get a clause-by-clause compliance report grounded in real labor law.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-jurisdiction="nl"
      className={`${dmSans.variable} ${playfair.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="bg-background text-foreground flex min-h-full flex-col">
        <ReportProvider>{children}</ReportProvider>
      </body>
    </html>
  );
}
