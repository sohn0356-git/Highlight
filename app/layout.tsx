import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "고등부 마일리지",
  description: "교회 고등부 마일리지 앱",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "마일리지" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#6366f1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-dvh bg-[#faf9f7] antialiased overscroll-none">
        <Providers>
          <main className="relative mx-auto w-full max-w-md min-h-dvh pb-20">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
