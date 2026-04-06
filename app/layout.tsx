import type { Metadata } from "next";
import { Cinzel_Decorative, Cinzel, EB_Garamond, Courier_Prime } from "next/font/google";
import { Header } from "@/components/layout/Header";
import "./globals.css";

const cinzelDecorative = Cinzel_Decorative({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-heading",
  display: "swap",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-ui",
  display: "swap",
});

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

const courierPrime = Courier_Prime({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-system",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Dark Wheel Archives",
  description: "Collaborative investigation platform for the Independent Raxxla Hunters",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${cinzelDecorative.variable} ${cinzel.variable} ${ebGaramond.variable} ${courierPrime.variable} font-body antialiased min-h-screen bg-bg-deep text-text-primary`}
      >
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
