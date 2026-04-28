import { GeistSans } from "geist/font/sans";
import { Source_Serif_4 } from "next/font/google";
import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import "./globals.css";
import React from 'react';
import { ThemeProvider } from '@/components/ThemeProvider';
import CookieConsent from '@/components/cookie-consent';

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-reader",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "TuFolio",
  description: "TuFolio · Preparación rigurosa para tus oposiciones. Temario validado, tests adaptativos y comunidad que avanza contigo.",
  manifest: "/manifest.json"
};

export const viewport = {
  themeColor: '#fff',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${GeistSans.className} ${sourceSerif.variable}`}>
      <body className="h-[100vh] bg-background text-foreground">
      <ThemeProvider
        attribute="class"
        enableSystem
        disableTransitionOnChange
      >
        <main className="max-h-screen h-full flex flex-col items-center">
          {children}
        </main>
        <Toaster />
        <Sonner position="top-center" expand={true} visibleToasts={9}/>
        <CookieConsent />
      </ThemeProvider>
      </body>
    </html>
  );
}
