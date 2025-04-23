"use client";

import { FC, ReactNode, memo } from "react";
import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { Session } from "next-auth";

interface SessionProviderProps {
  children: ReactNode;
  session?: Session | null;
}

export const SessionProvider: FC<SessionProviderProps> = memo(
  ({ children, session }) => {
    return (
      <NextAuthSessionProvider
        session={session}
        refetchInterval={60 * 5} // Refresh session every 5 minutes
        refetchOnWindowFocus={true}
      >
        {children}
      </NextAuthSessionProvider>
    );
  }
);

SessionProvider.displayName = "SessionProvider";
