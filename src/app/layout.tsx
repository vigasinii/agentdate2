import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AgentDate",
  description: "AI agents that date on your behalf",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.variable + " " + geistMono.variable}>
      <body className="flex min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
        <Sidebar />
        <main className="flex-1 pb-16 md:pb-0 min-h-screen overflow-x-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}
