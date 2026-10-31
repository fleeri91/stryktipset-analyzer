import type { Metadata } from "next";
import { Atkinson_Hyperlegible_Next, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { cn } from "@/lib/utils";

const atkinson = Atkinson_Hyperlegible_Next({
  subsets: ["latin"],
  variable: "--font-sans",
  // No metric overrides exist for this font, so fall back to the system font
  adjustFontFallback: false,
  fallback: ["system-ui", "sans-serif"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stryktipsanalys",
  description: "Hitta understreckade tecken på Stryktipset med odds, form och inbördes möten",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="sv" className={cn("dark h-full antialiased font-sans", atkinson.variable, geistMono.variable)}>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
