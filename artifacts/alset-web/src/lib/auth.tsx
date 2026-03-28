import React, { createContext, useContext, useState, useEffect } from "react";
import type { AlsetUser } from "@workspace/api-client-react";

interface AuthContextType {
  user: AlsetUser | null;
  token: string | null;
  login: (user: AlsetUser, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Global fetch interceptor to automatically inject JWT token into all generated API requests
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const token = localStorage.getItem("alset_token");
  if (token) {
    if (args[0] instanceof Request) {
      args[0].headers.set("Authorization", `Bearer ${token}`);
    } else {
      args[1] = args[1] || {};
      args[1].headers = {
        ...args[1].headers,
        Authorization: `Bearer ${token}`,
      };
    }
  }
  return originalFetch(...args);
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AlsetUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("alset_token");
    const storedUser = localStorage.getItem("alset_user");
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem("alset_token");
        localStorage.removeItem("alset_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newUser: AlsetUser, newToken: string) => {
    setUser(newUser);
    setToken(newToken);
    localStorage.setItem("alset_token", newToken);
    localStorage.setItem("alset_user", JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("alset_token");
    localStorage.removeItem("alset_user");
    window.location.href = window.location.origin + import.meta.env.BASE_URL + "login";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!user && !!token,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
