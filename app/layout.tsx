import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "ZapComanda — Pare de perder pedido no WhatsApp",
  description:
    "Automatize cardápio, Pix e gestão de pedidos para sua lanchonete ou quentinha. Bot no WhatsApp, painel em tempo real. A partir de R$ 49/mês.",
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
  openGraph: {
    title: "ZapComanda — Pedidos automáticos via WhatsApp",
    description:
      "Cardápio interativo, Pix na hora e painel de pedidos. Feito para lanchonete de bairro e marmiteira.",
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
