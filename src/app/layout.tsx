import type { Metadata } from "next";
import { Montserrat, Open_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Caps Collective - Community Relationship Mapping",
  description: "Connect skills, relationships, and community needs",
  icons: {
    icon: "/whitecaps-logo.webp",
    shortcut: "/whitecaps-logo.webp",
    apple: "/whitecaps-logo.webp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${montserrat.variable} ${openSans.variable} ${geistMono.variable} antialiased bg-pattern min-h-screen relative`}
        suppressHydrationWarning
      >
        {/* Ambient Background Orbs for Glassmorphism Depth */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#99D6EA] opacity-20 blur-[120px] mix-blend-multiply animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-[#00245D] opacity-10 blur-[150px] mix-blend-multiply" />
          <div className="absolute top-[20%] right-[15%] w-[300px] h-[300px] rounded-full bg-[#D4C4A8] opacity-20 blur-[100px] mix-blend-multiply" />
        </div>

        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
