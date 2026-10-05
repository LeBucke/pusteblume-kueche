import type { Metadata } from "next";
import { Dosis, Nunito } from "next/font/google";
import "./globals.css";

const dosis = Dosis({
  variable: "--font-dosis",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "Pusteblume Küche",
    template: "%s · Pusteblume Küche",
  },
  description: "Rezepte, Speiseplan und Einkauf der Kita Pusteblume e.V. Kempen",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className={`${dosis.variable} ${nunito.variable}`}>
      <body className="min-h-dvh font-body antialiased">{children}</body>
    </html>
  );
}
