import { useEffect } from "react";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  role: string;
  exp: number;
}

const ProtectDashboard: React.FC = () => {
  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Missing token");

      const decoded = jwtDecode<DecodedToken>(token);

      const isExpired = decoded.exp * 1000 < Date.now();
      const isAdmin = decoded.role === "admin";

      if (!isAdmin || isExpired) {
        throw new Error("Unauthorized");
      }
    } catch (err) {
      console.warn("Redirecting to login due to:", err);
      window.location.href = "/";
    }
  }, []);

  return null; // nothing to render
};

export default ProtectDashboard;
