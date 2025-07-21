import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; 
import { QueryProvider } from "@/app/components/providers/query-provider";  

const inter = Inter({ 
  subsets: ["latin"],
  display: "swap",
  fallback: ['system-ui', 'arial'],
  preload: true,
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: "Photo Studio",
  description: "Web fotografi professional",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={inter.className}>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
} 