import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "A 股资金流向 · CN Sector Flow",
  description: "A 股板块/个股资金流可视化 · 申万一级 / 概念 · 主力净流入 · 板块轮动",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full bg-zinc-950 text-zinc-100 flex flex-col">
        <header className="border-b border-zinc-800 px-6 py-3 flex items-center gap-6">
          <span className="font-semibold tracking-tight">
            A 股资金流向 ·{" "}
            <span className="text-zinc-500">CN Sector Flow</span>
          </span>
          <nav className="flex gap-4 text-sm">
            <Link href="/" className="text-zinc-300 hover:text-white">
              总览
            </Link>
            <Link href="/rotation" className="text-zinc-300 hover:text-white">
              轮动图
            </Link>
            <Link href="/stocks" className="text-zinc-300 hover:text-white">
              个股
            </Link>
          </nav>
        </header>
        <main className="flex-1 px-6 py-5">{children}</main>
      </body>
    </html>
  );
}
