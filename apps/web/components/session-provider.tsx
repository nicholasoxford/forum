"use client";

import { FC, ReactNode, memo } from "react";
import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

interface SessionProviderProps {
  children: ReactNode;
}

export const SessionProvider: FC<SessionProviderProps> = memo(
  ({ children }) => {
    return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
  }
);

SessionProvider.displayName = "SessionProvider";
