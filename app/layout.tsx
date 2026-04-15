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
  title: "GymFlow - Advanced Gym Management SaaS",
  description: "Streamline your gym operations with GymFlow. Manage members, trainers, attendance, and subscriptions in one platform.",
  keywords: ["gym management", "fitness software", "SaaS", "member tracking", "trainer scheduling"],
  authors: [{ name: "Khubaib Shah" }],
  openGraph: {
    title: "GymFlow - Modern Gym Management",
    description: "The complete toolkit for modern gym owners. Start managing your fitness business effectively today.",
    url: "https://gymflow-management.vercel.app/",
    siteName: "GymFlow",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "GymFlow Dashboard Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GymFlow | Gym Management SaaS",
    description: "Streamline your fitness business with our comprehensive management system.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-light-32x32.png", media: "(prefers-color-scheme: light)" },
      { url: "/icon-dark-32x32.png", media: "(prefers-color-scheme: dark)" },
    ],
    apple: "/apple-icon.png",
  },
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
