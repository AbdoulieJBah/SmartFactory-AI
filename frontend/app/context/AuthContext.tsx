"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../lib/api";
import { AuthUser, isAuthenticated, logout } from "../lib/auth";

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
    let active = true;
    if (!isAuthenticated()) {
      setLoading(false);
      return;
    }
    api.get("/users/me")
      .then(({ data }) => {
        if (active) {
          setUser(data);
          setAuthenticated(true);
        }
      })
      .catch(() => {
        if (active) {
          setUser(null);
          setAuthenticated(false);
        }
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
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