import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@workspace/ui/styles/globals.css";
import { WalletProvider } from "../components/wallet-connect/wallet-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Token Rewards Platform",
  description: "Earn rewards while you chat in our private Telegram group",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}
