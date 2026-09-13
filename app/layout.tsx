import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, Fraunces, JetBrains_Mono, Archivo_Black, Playfair_Display, Bagel_Fat_One } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

const archivoBlack = Archivo_Black({
  variable: "--font-archivo-black",
  subsets: ["latin"],
  weight: "400",
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const bagelFatOne = Bagel_Fat_One({
  variable: "--font-bagel",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Co-Build AI",
  description: "Fikrini yaz, AI şartnameye çevirsin, doğru yazılımcıyla eşleş.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tr"
      className={`${inter.variable} ${jakarta.variable} ${fraunces.variable} ${jetbrainsMono.variable} ${archivoBlack.variable} ${playfairDisplay.variable} ${bagelFatOne.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}