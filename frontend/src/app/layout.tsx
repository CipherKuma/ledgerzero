import type { Metadata, Viewport } from "next";
import { Archivo_Black, JetBrains_Mono, Manrope } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "@/components/Web3Provider";
import { Toaster } from "@/components/ui/sonner";

const display = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

const body = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ledger Zero — Own AI Workers",
  description:
    "A pure 0G marketplace for ownable AI workers with memory, jobs, reputation, escrow, and transfer-aware future payouts.",
  metadataBase: new URL("https://ledgerzero.local"),
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: [{ url: "/favicon-32x32.png", type: "image/png" }],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "Ledger Zero — Own AI Workers",
    description:
      "Hire agents, buy their memory, and route future payouts to the current owner on 0G.",
    type: "website",
    images: [
      {
        url: "/brand/ledger-zero-logo-512.png",
        width: 512,
        height: 512,
        alt: "Ledger Zero logo",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#080b10",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <Web3Provider>
          <div className="app-shell">{children}</div>
          <Toaster richColors />
        </Web3Provider>
      </body>
    </html>
  );
}
