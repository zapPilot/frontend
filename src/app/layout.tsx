import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SimpleWeb3Provider } from "@/providers/SimpleWeb3Provider";
import { OnboardingProvider } from "@/providers/OnboardingProvider";
import { ToastProvider } from "@/hooks/useToast";
import { UserProvider } from "@/contexts/UserContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zap Pilot - Portfolio Management",
  description:
    "Intent-based execution engine for DeFi portfolio management. Build and manage diversified portfolios with advanced automation.",
  keywords: [
    "DeFi",
    "Portfolio Management",
    "Cryptocurrency",
    "Blockchain",
    "Intent-based Execution",
  ],
  authors: [{ name: "Zap Pilot Team" }],
  creator: "Zap Pilot",
  publisher: "Zap Pilot",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Zap Pilot",
  },
  openGraph: {
    type: "website",
    siteName: "Zap Pilot",
    title: "Zap Pilot - Portfolio Management",
    description: "Intent-based execution engine for DeFi portfolio management",
  },
  twitter: {
    card: "summary_large_image",
    title: "Zap Pilot - Portfolio Management",
    description: "Intent-based execution engine for DeFi portfolio management",
  },
};

export const viewport: Viewport = {
  themeColor: "#8b5cf6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.svg" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <meta name="theme-color" content="#8b5cf6" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-950 text-white`}
      >
        <SimpleWeb3Provider>
          <UserProvider>
            <OnboardingProvider>
              <ToastProvider>{children}</ToastProvider>
            </OnboardingProvider>
          </UserProvider>
        </SimpleWeb3Provider>
      </body>
    </html>
  );
}
