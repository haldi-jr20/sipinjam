import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { TransactionProvider } from "@/lib/TransactionContext";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: '--font-plus-jakarta',
});

export const metadata: Metadata = {
  title: "PINSET — Sistem Keluar Masuk Alat Produksi",
  description: "Sistem manajemen peminjaman alat produksi dengan approval koordinator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        {/* Material Symbols Outlined */}
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning className={`${inter.variable} ${plusJakartaSans.variable} font-sans bg-background text-on-background min-h-screen antialiased relative overflow-x-hidden`}>
        <TransactionProvider>
          {children}
        </TransactionProvider>
      </body>
    </html>
  );
}
