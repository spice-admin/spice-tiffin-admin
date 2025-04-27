import React, { useState } from "react";

const LoginForm: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const apiBaseUrl =
    import.meta.env.PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";
  const loginUrl = `${apiBaseUrl}/admin/login`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch(loginUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Invalid credentials");
      }

      localStorage.setItem("token", data.token);
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 200);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {error && (
        <div className="alert alert-danger text-center mb-4" role="alert">
          {error}
        </div>
      )}
      <form className="my-4" onSubmit={handleSubmit}>
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

        <div className="form-group row mt-3">
          <div className="col-sm-6">
            <div className="form-check form-switch form-switch-primary">
              <input
                className="form-check-input"
                type="checkbox"
                id="remember"
                disabled={isLoading}
              />
              <label className="form-check-label" htmlFor="remember">
                Remember me
              </label>
            </div>
          </div>
          <div className="col-sm-6 text-end">
            <a href="#" className="text-muted font-13">
              Forgot password?
            </a>
          </div>
        </div>

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
                    <span className="spinner-border spinner-border-sm me-1"></span>
                    Logging In...
                  </>
                ) : (
                  <>
                    Log In <i className="fas fa-sign-in-alt ms-1"></i>
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
