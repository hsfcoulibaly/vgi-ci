import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Néhémie — Gestion Locative",
  description: "Application de gestion immobilière adaptée à la Côte d'Ivoire",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full">
      <body className={`${inter.className} h-full bg-gray-50`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
