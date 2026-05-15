import type React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";
import { LayoutWrapper } from "@/components/layout-wrapper";
import { Providers } from "@/components/providers";
import "./globals.css";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0f172a",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://gymflow-management.vercel.app/"),
  title: {
    default: "GymFlow - Advanced Gym Management SaaS",
    template: "%s | GymFlow"
  },
  description: "The complete toolkit for modern gym owners. Streamline operations, automate QR attendance, manage billing, and track performance with GymFlow SaaS.",
  keywords: [
    "gym management software", 
    "fitness management system", 
    "gym automation", 
    "QR attendance tracker", 
    "gym billing software", 
    "member management SaaS",
    "fitness business growth",
    "gym POS system",
    "workout tracker app"
  ],
  authors: [{ name: "Khubaib Shah" }],
  creator: "Khubaib Shah",
  publisher: "GymFlow",
  openGraph: {
    title: "GymFlow - Modern Gym Management Software",
    description: "Stop losing money. Run your gym smarter with automated QR attendance, smart billing, and a complete POS system.",
    url: "https://gymflow-management.vercel.app/",
    siteName: "GymFlow SaaS",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "GymFlow Dashboard - Advanced Management Toolkit",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GymFlow | The Smartest way to run your Gym",
    description: "Automated attendance, billing, and member management. Everything your gym needs to run on autopilot.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/assets/favicon/favicon.ico" },
      { url: "/assets/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/assets/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/assets/favicon/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/assets/favicon/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
};

import { ThemeProvider } from "@/components/theme-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning cz-shortcut-listen="true">
      <body className={`font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          disableTransitionOnChange
        >
          <Providers>
            <LayoutWrapper>{children}</LayoutWrapper>
          </Providers>
          <Toaster position="top-right" richColors />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
