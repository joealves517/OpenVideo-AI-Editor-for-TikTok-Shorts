import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit-sans" });

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OpenVideo Editor",
  description: "High-performance browser and extension video editor",
  icons: {
    icon: "/icon48.png",
    shortcut: "/icon16.png",
    apple: "/icon128.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(geistMono.variable, "font-sans", outfit.variable)}
    >
      <body className={`antialiased dark`}>
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}
