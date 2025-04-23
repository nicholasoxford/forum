"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { WalletProvider } from "./wallet-connect/wallet-provider";
import { SessionProvider } from "./session-provider";
import { Session } from "next-auth";

// This component ensures theme application happens only on the client side
function ThemeProviderClient({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      enableColorScheme
    >
      {children}
    </NextThemesProvider>
  );
}

interface ProvidersProps {
  children: React.ReactNode;
  session?: Session | null;
}

export const Providers = React.memo(({ children, session }: ProvidersProps) => {
  const [mounted, setMounted] = React.useState(false);

  // Prevent hydration mismatch by only mounting after client-side hydration
  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <SessionProvider session={session}>
      <WalletProvider>
        <ThemeProviderClient>
          {mounted ? (
            children
          ) : (
            <div style={{ visibility: "hidden" }}>{children}</div>
          )}
        </ThemeProviderClient>
      </WalletProvider>
    </SessionProvider>
  );
});

Providers.displayName = "Providers";
