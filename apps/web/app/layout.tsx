import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "@workspace/ui/styles/globals.css";
import { Providers } from "../components/providers";
import { AuthDebugLink } from "./auth-debug/debug-link";
import { CustomHeader } from "../components/custom-header";

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
        <Providers>
          <CustomHeader />
          <div className="fixed bottom-4 right-4 z-50">
            <AuthDebugLink />
          </div>
          {children}
        </Providers>
      </body>
    </html>
  );
}
