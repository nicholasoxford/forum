import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "@workspace/ui/styles/globals.css";
import { Providers } from "../components/providers";
import { CustomHeader } from "../components/custom-header";
import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth";

const inter = Inter({ subsets: ["latin"] });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "Token Rewards Platform",
  description: "Earn rewards while you chat in our private Telegram group",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get the session server-side
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} ${spaceGrotesk.variable} token-flow-bg min-h-screen`}
      >
        <Providers session={session}>
          <CustomHeader />
          <main className="pt-16">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
