import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AutoServis İdarəetmə Sistemi",
  description: "Avtomobil xidməti idarəetmə sistemi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="az">
      <body className="antialiased">{children}</body>
    </html>
  );
}
