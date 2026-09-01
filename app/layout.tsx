import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "./providers";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import PointToast from "@/components/PointToast";

export const metadata: Metadata = {
  title: "고등부 Highlight",
  description: "교회 고등부 Highlight 앱",
  manifest: "/Highlight/manifest.json",
  icons: {
    icon: [
      { url: "/Highlight/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/Highlight/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/Highlight/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Highlight",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#6366f1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/Highlight/icons/apple-touch-icon.png" />
        <meta name="theme-color" content="#6366f1" />
      </head>
      <body className="min-h-dvh bg-[#faf9f7] antialiased overscroll-none">
        <ServiceWorkerRegister />
        <PointToast />
        <Providers>
          <main className="relative w-full min-h-dvh pb-20 sm:mx-auto sm:max-w-md">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
