"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { AuthUser, getUser, isAuthenticated, logout } from "../lib/auth";

interface AuthContextType {
  user: AuthUser | null;
  authenticated: boolean;
  loading: boolean;
  logoutUser: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  authenticated: false,
  loading: true,
  logoutUser: logout,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getUser());
    setAuthenticated(isAuthenticated());
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        authenticated,
        loading,
        logoutUser: logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}