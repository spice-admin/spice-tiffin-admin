import React, { useState } from "react";
// 1. Import the Supabase client
//    Adjust the path based on your file structure.
//    If LoginForm.tsx is in src/components/auth/ and supabaseClient.ts is in src/lib/,
//    then '../../lib/supabaseClient' should be correct.
import { supabase } from "../../lib/supabaseClient"; // Or your actual path

const LoginForm: React.FC = () => {
  // 2. 'username' state will be used as 'email' for Supabase
  const [username, setUsername] = useState(""); // Corresponds to email
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // 3. Sign in with Supabase Auth
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: username, // Use 'username' state as email
          password: password,
        });

      if (authError) {
        // Handle Supabase specific auth errors
        console.error("Supabase login failed (auth):", authError);
        setError(authError.message || "Invalid login credentials.");
        setIsLoading(false);
        return;
      }

      if (authData.user) {
        // 4. User is authenticated with Supabase. Now check if they are in the 'admins' table.
        const { data: adminRecord, error: adminCheckError } = await supabase
          .from("admins") // Your dedicated admins table
          .select("id") // We only need to confirm existence
          .eq("id", authData.user.id)
          .maybeSingle(); // Expects exactly one record or errors

        if (adminCheckError) {
          // This error should now only be for actual DB/network issues
          console.error(
            "Full adminCheckError object (with maybeSingle):",
            JSON.stringify(adminCheckError, null, 2)
          );
          setError(adminCheckError.message || "Error verifying admin status.");
          await supabase.auth.signOut();
          setIsLoading(false);
          return;
        }

        if (adminRecord) {
          // 5. Login successful AND user is a verified admin
          console.log("Admin login successful!");
          // Supabase handles session storage automatically. No need for localStorage.setItem("token", ...).

          // Redirect to dashboard (your existing code redirects to /dashboard)
          // Ensure /dashboard is the correct admin dashboard path.
          setTimeout(() => {
            window.location.href = "/dashboard";
          }, 200);
        } else {
          // This case should ideally be caught by adminCheckError.code === 'PGRST116' with .single()
          setError("Authentication successful, but not authorized as admin.");
          await supabase.auth.signOut();
        }
      } else {
        // Should not happen if authError is not present, but as a fallback
        setError("Login failed: No user data received.");
      }
    } catch (err: any) {
      console.error("Login process error:", err);
      setError(err.message || "An unexpected error occurred during login.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Your existing JSX for the form remains the same
    <>
      {error && (
        <div className="alert alert-danger text-center mb-4" role="alert">
          {error}
        </div>
      )}
      <form className="my-4" onSubmit={handleSubmit}>
        <div className="form-group mb-2">
          <label htmlFor="username" className="form-label">
            Username (Email) {/* Clarify that this is the email */}
          </label>
          <input
            type="email" // Changed type to "email" for better semantics
            id="username"
            className="form-control"
            placeholder="Enter your email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <div className="form-group mb-3">
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <input
            type="password"
            id="password"
            className="form-control"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        {/* Remember/Forgot Row - Keep your existing JSX */}
        <div className="form-group row mt-3">
          <div className="col-sm-6">
            {/* <div className="form-check">
              <input className="form-check-input" type="checkbox" id="remember-me" />
              <label className="form-check-label" htmlFor="remember-me">Remember me</label>
            </div> */}
            {/* Your "Remember me" JSX */}
          </div>
          <div className="col-sm-6 text-end">
            {/* <a href="auth-recover-pw.html" className="text-muted fs-13"><i className="mdi mdi-lock"></i> Forgot your password?</a> */}
            {/* Your "Forgot password" JSX */}
          </div>
        </div>
        <div className="form-group mb-0 row">
          <div className="col-12">
            <div className="d-grid mt-3">
              <button
                className="btn btn-primary" // Use your existing button classes
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-1"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Logging In...
                  </>
                ) : (
                  <>
                    Log In <i className="fas fa-sign-in-alt ms-1"></i>{" "}
                    {/* Ensure you have Font Awesome if using this icon */}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </>
  );
};

export default LoginForm;
