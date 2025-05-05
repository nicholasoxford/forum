"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { WalletProvider } from "./wallet-connect/wallet-provider";
import { SessionProvider } from "./session-provider";

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
}

export const Providers = React.memo(({ children }: ProvidersProps) => {
  const [mounted, setMounted] = React.useState(false);

  // Prevent hydration mismatch by only mounting after client-side hydration
  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <SessionProvider>
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
