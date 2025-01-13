import type { Metadata } from "next";
import { Inter } from "next/font/google";
import React from "react";
import "@assets/styles/globals.css";
import { Header, Footer } from "@components/index";
import FavIcon from "@images/icons/favicon.ico";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Detect and Classify Dangerous Animals",
  description: "Upload an image of an animal and I'll tell you if it's dangerous or not.",
  icons: {
    icon: FavIcon.src,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex flex-col min-h-screen ">
          <Header />
          <main>{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
