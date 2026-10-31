import type { Metadata, Viewport } from "next";
import { BIZ_UDPGothic, Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-geist",
});

// 日本語の字が大きいので、ブラウザが使う分だけ取りに行く
const bizUdpGothic = BIZ_UDPGothic({
  weight: ["400", "700"],
  display: "swap",
  preload: false,
  variable: "--font-biz",
});

export const metadata: Metadata = {
  title: "split-ledger",
  description: "立て替えたお金を記録して、誰が誰にいくら返せばいいかを一目で確かめる精算ページ",
};

export const viewport: Viewport = {
  themeColor: "#F2F4F7",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className={`${geist.variable} ${bizUdpGothic.variable}`}>
      <body>{children}</body>
    </html>
  );
}
