import { createContext, useContext, useMemo, useState } from "react";
import { authService } from "../services/authService.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(authService.getCurrentUser());

  async function login(email, password) {
    const session = await authService.login(email, password);
    setUser(session.user);
    return session.user;
  }

  async function register(payload) {
    const session = await authService.register(payload);
    setUser(session.user);
    return session.user;
  }

  async function updateProfile(updates) {
    const updatedUser = await authService.updateProfile(user, updates);
    setUser(updatedUser);
    return updatedUser;
  }

  function logout() {
    authService.logout();
    setUser(null);
  }

  const value = useMemo(() => ({ user, login, register, updateProfile, logout }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
