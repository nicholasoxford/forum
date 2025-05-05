"use client";

import {
  FC,
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
  memo,
} from "react";
import { getCurrentSession } from "@/utils/server-auth";

// Create auth context with session data
export interface AuthContextData {
  session: any | null;
  isLoading: boolean;
  status: "loading" | "authenticated" | "unauthenticated";
  refreshSession: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextData>({
  session: null,
  isLoading: true,
  status: "loading",
  refreshSession: async () => {},
});

// Hook to use auth context
export const useAuth = () => useContext(AuthContext);

interface SessionProviderProps {
  children: ReactNode;
}

export const SessionProvider: FC<SessionProviderProps> = memo(
  ({ children }) => {
    const [session, setSession] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [status, setStatus] = useState<
      "loading" | "authenticated" | "unauthenticated"
    >("loading");

    const refreshSession = async () => {
      try {
        setIsLoading(true);
        const userSession = await getCurrentSession();

        if (userSession) {
          setSession(userSession);
          setStatus("authenticated");
        } else {
          setSession(null);
          setStatus("unauthenticated");
        }
      } catch (error) {
        console.error("Failed to refresh session:", error);
        setSession(null);
        setStatus("unauthenticated");
      } finally {
        setIsLoading(false);
      }
    };

    // Initial session fetch
    useEffect(() => {
      refreshSession();
    }, []);

    // Refresh session periodically (every 5 minutes)
    useEffect(() => {
      const intervalId = setInterval(refreshSession, 5 * 60 * 1000);
      return () => clearInterval(intervalId);
    }, []);

    const value = {
      session,
      isLoading,
      status,
      refreshSession,
    };

    return (
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
  }
);

SessionProvider.displayName = "SessionProvider";
