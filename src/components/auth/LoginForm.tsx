// src/components/auth/LoginForm.tsx
import React, { useState } from "react";

const LoginForm: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Read from environment variable, provide fallback
  const apiBaseUrl =
    import.meta.env.PUBLIC_API_BASE_URL ||
    "https://spice-tiffin-backend-production.up.railway.app/api/v1"; // Fallback just in case

  // Construct the full login URL
  const loginUrl = `${apiBaseUrl}/admin/login`; // Should point to Railway

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // --- DEBUG LOG ---
    console.log("Attempting to fetch login URL:", loginUrl);
    // Verify the value of apiBaseUrl as seen by the client
    console.log("API Base URL from env:", import.meta.env.PUBLIC_API_BASE_URL);
    // ---------------

    try {
      const res = await fetch(loginUrl, {
        // Use the constructed absolute URL
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Throw error using message from backend if available
        throw new Error(
          data.message || `Request failed with status ${res.status}`
        );
      }

      // Login successful
      console.log("Login successful, storing token...");
      localStorage.setItem("token", data.token); // Use consistent key 'token'
      // Redirect after a short delay
      setTimeout(() => {
        window.location.href = "/dashboard"; // Redirect to admin dashboard
      }, 200);
    } catch (err: any) {
      console.error("Login fetch error:", err);
      setError(err.message || "Something went wrong during login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // --- Keep existing JSX ---
    <>
      {error && (
        <div className="alert alert-danger text-center mb-4" role="alert">
          {error}
        </div>
      )}
      <form className="my-4" onSubmit={handleSubmit}>
        {/* Username Input */}
        <div className="form-group mb-2">
          <label htmlFor="username" className="form-label">
            Username
          </label>
          <input
            type="text"
            id="username"
            className="form-control"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        {/* Password Input */}
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
        {/* Remember/Forgot Row */}
        <div className="form-group row mt-3">
          <div className="col-sm-6">... Remember me ...</div>
          <div className="col-sm-6 text-end">... Forgot password ...</div>
        </div>
        {/* Submit Button */}
        <div className="form-group mb-0 row">
          <div className="col-12">
            <div className="d-grid mt-3">
              <button
                className="btn btn-primary"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    {" "}
                    <span className="spinner-border spinner-border-sm me-1"></span>{" "}
                    Logging In...{" "}
                  </>
                ) : (
                  <>
                    {" "}
                    Log In <i className="fas fa-sign-in-alt ms-1"></i>{" "}
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
