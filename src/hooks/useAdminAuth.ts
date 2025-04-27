import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";

interface JwtPayload {
  adminId: string;
  role: string;
  exp: number;
}

export const useAdminAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return setIsAuthenticated(false);

    try {
      const decoded = jwtDecode<JwtPayload>(token);

      const isExpired = decoded.exp * 1000 < Date.now();
      const isAdmin = decoded.role === "admin";

      if (!isExpired && isAdmin) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    }
  }, []);

  return isAuthenticated;
};
