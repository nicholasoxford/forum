import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "@workspace/ui/styles/globals.css";
import { WalletProvider } from "../components/wallet-connect/wallet-provider";
import { Header } from "@workspace/ui/components/header";

const inter = Inter({ subsets: ["latin"] });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

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
      <body
        className={`${inter.className} ${spaceGrotesk.variable} token-flow-bg`}
      >
        <WalletProvider>
          <Header />
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}
