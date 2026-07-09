import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: "Alunika",
  title: {
    default: "Aktivasi Pesanan — Alunika",
    template: "%s — Alunika",
  },
  description:
    "Aktivasi pesanan aplikasimu di Alunika. Isi form aktivasi, lalu terhubung langsung dengan tim CS kami.",
  keywords: ["Alunika", "aktivasi", "aktivasi pesanan", "onboarding", "aplikasi"],
  authors: [{ name: "Alunika" }],
  creator: "Alunika",
  publisher: "Alunika",
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  openGraph: {
    title: "Aktivasi Pesanan — Alunika",
    description:
      "Aktivasi pesanan aplikasimu di Alunika. Isi form aktivasi, lalu terhubung langsung dengan tim CS kami.",
    siteName: "Alunika",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Aktivasi Pesanan — Alunika",
    description:
      "Aktivasi pesanan aplikasimu di Alunika. Isi form aktivasi, lalu terhubung langsung dengan tim CS kami.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
