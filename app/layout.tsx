import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
import { SupabaseSetupBanner } from "@/components/SupabaseSetupBanner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
});

export const metadata: Metadata = {
  title: "LLM Council",
  description: "Evaluate ideas through multiple AI perspectives",
};

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="font-sans antialiased min-h-screen bg-council-bg text-slate-200">
        <SupabaseSetupBanner />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
