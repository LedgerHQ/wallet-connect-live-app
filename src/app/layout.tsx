import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { PropsWithChildren } from "react";
import "./reset.css";
import "./globals.css";
// import { ApplicationDisabled } from "@/components/screens/ApplicationDisabled";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ledger WalletConnect",
  description: "Ledger Live Wallet with WalletConnect",
};

export default function RootLayout({ children }: PropsWithChildren) {
  // const isApplicationDisabled = Boolean(process.env.NEXT_PUBLIC_APPLICATION_DISABLED === "true");

  return (
    <html lang="en">
      <body className={inter.className}>
        {/* {isApplicationDisabled ? <ApplicationDisabled /> : children} */}
        {children}
      </body>
    </html>
  );
}
