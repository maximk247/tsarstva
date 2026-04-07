import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "Чтение Царств",
  description: "Параллельное чтение книг Царств с пророками",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-stone-50 text-stone-900 antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
