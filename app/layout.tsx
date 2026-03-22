import type { Metadata } from "next";
import { Geist, Nanum_Myeongjo } from "next/font/google";
import "./globals.css";
import { AppNav } from "@/components/app-nav";
import { AppShell } from "@/components/app-shell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const nanumMyeongjo = Nanum_Myeongjo({
  variable: "--font-nanum-myeongjo",
  subsets: ["latin"],
  weight: "700",
});

export const metadata: Metadata = {
  title: "The Hunt",
  description: "Analyze Boston neighborhoods for house hunting",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${nanumMyeongjo.variable} font-sans bg-white antialiased`}>
        <AppNav />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
