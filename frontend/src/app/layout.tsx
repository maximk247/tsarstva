import type { Metadata } from "next";
import { Inter, Alegreya } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/shared/config/theme-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

const alegreya = Alegreya({
  variable: "--font-alegreya",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "700"],
  style: ["normal", "italic"],
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
    <html lang="ru" className={`${inter.variable} ${alegreya.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
