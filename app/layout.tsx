import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "ZapComanda — Cardápio digital e gestão de pedidos",
  description:
    "Cardápio digital próprio, Pix na hora e painel de pedidos em tempo real. Para lanchonete, marmita, doces e confeitaria. A partir de R$ 49/mês.",
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
  openGraph: {
    title: "ZapComanda — Cardápio digital e gestão de pedidos",
    description:
      "Cardápio interativo, Pix na hora e painel de pedidos. Para quentinha, lanchonete, doceria e confeitaria.",
    locale: "pt_BR",
    type: "website",
    images: ["/logo.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
