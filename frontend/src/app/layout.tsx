import type { Metadata } from "next";
import { Inter, Alegreya } from "next/font/google";
import "./globals.css";
import {
  BIBLE_FONT_FAMILY_LS_KEY,
  BIBLE_FONT_FAMILY_OPTIONS,
} from "@/features/font-family/constants/fonts";
import { ThemeProvider } from "@/shared/configs/theme-provider";

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
  title: "Чтение Царств с параллелями",
  description: "Параллельное чтение книг Царств и связанных мест",
};

const bibleFontFamilyValues = Object.fromEntries(
  BIBLE_FONT_FAMILY_OPTIONS.map((font) => [font.key, font.value]),
);

const readerSettingsScript = `(function(){try{var s={xs:'0.8125rem',sm:'0.9375rem',md:'1.0625rem',lg:'1.1875rem',xl:'1.3125rem'};var k=localStorage.getItem('bible-font-size');if(s[k])document.documentElement.style.setProperty('--bible-font-size',s[k]);var f=${JSON.stringify(bibleFontFamilyValues)};var fk=localStorage.getItem(${JSON.stringify(BIBLE_FONT_FAMILY_LS_KEY)});if(f[fk])document.documentElement.style.setProperty('--bible-font-family',f[fk]);}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${inter.variable} ${alegreya.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: readerSettingsScript,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
