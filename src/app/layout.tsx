import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Wallpaper Plus - Beautiful Wallpapers",
  description: "Discover thousands of high-quality wallpapers for your desktop, mobile, and tablet. All wallpapers are free to download and use.",
  manifest: "/manifest.json",
  themeColor: "#8b5cf6",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Wallpaper Plus",
  },
  icons: {
    icon: [
      { url: "/icons/96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/icons/144x144.png", sizes: "144x144", type: "image/png" },
      { url: "/icons/192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <FavoritesProvider>
            {children}
          </FavoritesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
