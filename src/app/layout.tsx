import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { HydrationProvider } from "@/components/ui/hydration-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Rakamin Recruitment Management",
  description:
    "Platform manajemen perekrutan modern untuk perusahaan dan pencari kerja",
  keywords: "recruitment, jobs, career, hiring, management",
  authors: [{ name: "Rakamin" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <div className="min-h-screen bg-white">
          <HydrationProvider>
            {children}
          </HydrationProvider>
        </div>
        <Toaster position="bottom-left" richColors closeButton />
      </body>
    </html>
  );
}
