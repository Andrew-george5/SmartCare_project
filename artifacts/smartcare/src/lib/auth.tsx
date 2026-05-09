import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { setAuthTokenGetter } from "@workspace/api-client-react";

interface User {
  userId: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  phoneNumber?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Keep a module-level reference so customFetch always gets the latest token,
// even on the very first render before any React effect has run.
let _latestToken: string | null = localStorage.getItem("smartcare_token");
setAuthTokenGetter(() => _latestToken);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("smartcare_token"));
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("smartcare_user");
    return stored ? JSON.parse(stored) : null;
  });

  // Keep the module-level ref in sync so the getter is always current.
  useEffect(() => {
    _latestToken = token;
  }, [token]);

  const login = useCallback((newToken: string, newUser: User) => {
    localStorage.setItem("smartcare_token", newToken);
    localStorage.setItem("smartcare_user", JSON.stringify(newUser));
    _latestToken = newToken;
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("smartcare_token");
    localStorage.removeItem("smartcare_user");
    _latestToken = null;
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, role: user?.role ?? null, login, logout, isAuthenticated: !!token && !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
