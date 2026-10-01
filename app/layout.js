import "./globals.css";
import { Inter } from "next/font/google";
import Shell from "@/components/Shell";
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
export const metadata = { title: "PadhaiHub — Your notes. One place.", description: "Find your notes, subjects and study materials in one place." };
export default function RootLayout({ children }) {
  return (<html lang="en"><body className={`${inter.variable} font-sans`}><Shell>{children}</Shell></body></html>);
}
