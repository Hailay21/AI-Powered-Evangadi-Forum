import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/auth/auth.service.js";

const AuthContext = createContext(undefined);

function readInitialUser() {
  const token = authService.getStoredToken();
  const storedUser = authService.getStoredUser();
  return token && storedUser ? storedUser : null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readInitialUser);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const register = async (userData) => {
    setLoading(true);
    try {
      const { user: createdUser } = await authService.register(userData);
      return { success: true, user: createdUser };
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    setLoading(true);
    try {
      const { user: loggedInUser } = await authService.login(credentials);
      setUser(loggedInUser);
      return { success: true };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    navigate("/auth");
  };

  const value = {
    user,
    loading,
    register,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
