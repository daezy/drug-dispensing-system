import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { Web3Provider } from "@/components/Web3Provider";
import { Toaster } from "react-hot-toast";
import DarkModeInitializer from "@/components/DarkModeInitializer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PharmChain - Blockchain Drug Dispensing System",
  description:
    "Secure, transparent, and blockchain-powered pharmaceutical management system",
  keywords: [
    "blockchain",
    "pharmacy",
    "healthcare",
    "prescription",
    "medicine",
  ],
  authors: [{ name: "PharmChain Team" }],
  robots: "index, follow",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${inter.className} antialiased min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 dark:text-white transition-colors duration-200`}
      >
        <DarkModeInitializer />
        <AuthProvider>
          <Web3Provider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: "#363636",
                  color: "#fff",
                },
                success: {
                  duration: 3000,
                  style: {
                    background: "#10b981",
                  },
                },
                error: {
                  duration: 5000,
                  style: {
                    background: "#ef4444",
                  },
                },
              }}
            />
          </Web3Provider>
        </AuthProvider>
      </body>
    </html>
  );
}
