import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

import { ToastProvider } from "@/components/common/Toast";
import { Web3Provider } from "@/components/web3/Web3Provider";
import { Inter } from 'next/font/google';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-ENM8LLWG7P";

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "Agentscan - ERC-8004 AI Agent Explorer",
  description: "Explore AI agents on the ERC-8004 protocol",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.variable} antialiased flex flex-col min-h-screen`} style={{ fontFamily: 'var(--font-inter), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}
        </Script>
        <Web3Provider>
          <ToastProvider>
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </ToastProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
