import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AgentDate — AI Dating Agents",
  description: "AI agents that date on your behalf",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex" style={{ background: "var(--bg)", color: "var(--text)" }}>
        <Sidebar />
        <main className="flex-1 min-h-screen pb-16 md:pb-0 overflow-x-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}
