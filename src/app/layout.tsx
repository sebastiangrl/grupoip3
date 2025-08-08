import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../hooks/use-auth";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GrupoIP3 - Sistema Contable",
  description: "Sistema contable multi-tenant para empresas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
