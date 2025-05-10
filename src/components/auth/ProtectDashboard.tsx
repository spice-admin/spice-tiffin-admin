// src/components/auth/ProtectDashboard.tsx
import { useEffect, useState } from "react";
// Adjust path to your supabaseClient file
import { supabase } from "../../lib/supabaseClient";
import { type User } from "@supabase/supabase-js";

const ProtectDashboard: React.FC = () => {
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        // 1. Get the current Supabase session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Error getting session:", sessionError);
          throw new Error("Session error");
        }

        if (!session || !session.user) {
          // No active Supabase session, or user is null
          throw new Error("Not authenticated");
        }

        // 2. User is authenticated with Supabase. Now check if they are in the 'admins' table.
        const user: User = session.user;
        const { data: adminRecord, error: adminCheckError } = await supabase
          .from("admins") // Your dedicated admins table
          .select("id") // We only need to confirm existence
          .eq("id", user.id)
          .maybeSingle(); // Returns data or null (if no row found), errors for DB issues

        if (adminCheckError) {
          console.error(
            "Error checking admin status in ProtectDashboard:",
            adminCheckError
          );
          throw new Error("Error verifying admin role");
        }

        if (!adminRecord) {
          // User is authenticated with Supabase BUT not found in the admins table
          console.warn("User is authenticated but not listed as an admin.");
          throw new Error("Unauthorized admin");
        }

        // 3. If we reach here, user has a session AND is in the admins table.
        console.log("Admin verified on dashboard.");
        setIsVerifying(false); // Allow dashboard to show
      } catch (err: any) {
        console.warn(
          "ProtectDashboard: Redirecting to login due to:",
          err.message
        );
        await supabase.auth.signOut().catch((signOutError) => {
          // Attempt to sign out gracefully
          console.error("Error during sign out on redirect:", signOutError);
        });
        window.location.href = "/"; // Redirect to your login page (root /)
      }
    };

    checkAdminStatus();
  }, []);

  if (isVerifying) {
    // Optional: You can return a loading spinner or null while verifying
    // For now, returning null means the page might briefly show before redirect,
    // or show nothing until verification is done.
    return null;
  }

  return null; // This component doesn't render anything itself, it just protects.
};

export default ProtectDashboard;
