import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify Wallet | Token Rewards Platform",
  description: "Verify your wallet to join the Telegram group",
};

export default function VerifyLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <main className="min-h-screen bg-background">{children}</main>;
}
