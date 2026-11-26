import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BootSplash } from "@/components/BootSplash";

export const metadata: Metadata = {
  title: "AIおみくじ | IT Connect Fes 2026",
  description: "AIがその場で書く、あなただけのおみくじ。IT統括部 アプリケーションサポートのブース体験。",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" data-theme="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=IBM+Plex+Sans+JP:wght@400;500;600;700&family=Shippori+Mincho+B1:wght@600;800&family=BIZ+UDPGothic:wght@400;700&family=Dela+Gothic+One&family=M+PLUS+1:wght@400;500;700;800;900&family=Roboto+Mono:wght@400;500&display=swap"
        />
      </head>
      <body>
        <div id="boot" aria-label="読み込み中" role="status">
          <video className="boot-vid" src="/media/boot-fire.mp4" poster="/media/boot-fire.jpg" autoPlay muted loop playsInline preload="auto" aria-hidden />
          <span className="boot-dots">
            <i />
            <i />
            <i />
          </span>
        </div>
        <BootSplash />
        {children}
      </body>
    </html>
  );
}
