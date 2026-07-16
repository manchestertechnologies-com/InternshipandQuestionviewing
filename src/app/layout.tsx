import type { Metadata } from "next";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";

export const metadata: Metadata = {
  title: "Manchester Technologies | Internship & Question Viewing Platform",
  description: "Internship Management, Question Entry, Question Review, and Question Viewing Platform for Manchester Technologies. Innovate, Develop, Dominate.",
  icons: {
    icon: "/logo.jpg"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-black text-white antialiased">
      <body className="min-h-full flex flex-col">
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
