// src/lib/axiosInstance.ts

import axios, { type InternalAxiosRequestConfig } from "axios";

// Get the base API URL from environment variables
const apiBaseUrl = import.meta.env.PUBLIC_API_BASE_URL;

if (!apiBaseUrl) {
  console.error("Error: PUBLIC_API_BASE_URL environment variable is not set.");
  // You might want to throw an error or handle this differently
}

// Create a configured Axios instance
const axiosInstance = axios.create({
  baseURL:
    apiBaseUrl ||
    "https://spice-tiffin-backend-production.up.railway.app/api/v1", // Fallback URL for safety
  timeout: 10000, // Optional: Set a request timeout (e.g., 10 seconds)
  headers: {
    "Content-Type": "application/json",
  },
});

// --- Request Interceptor ---
// This function runs before each request is sent
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Retrieve the admin token from storage (adjust key if needed)
    // Use localStorage or sessionStorage depending on where you stored it during login
    const adminToken = localStorage.getItem("token"); // Or sessionStorage.getItem(...)

    if (adminToken) {
      // If the token exists, add it to the Authorization header
      config.headers.Authorization = `Bearer ${adminToken}`;
      // console.log("[AxiosInstance] Token added to request headers.");
    } else {
      // console.warn("[AxiosInstance] No admin token found in storage.");
      // Optional: Handle cases where the token is missing but required
      // You could potentially cancel the request or redirect to login here,
      // but often error handling is done in the service/component level based on 401 responses.
    }

    return config; // Return the modified config
  },
  (error) => {
    // Handle request configuration errors
    console.error("[AxiosInstance] Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// --- Response Interceptor (Optional) ---
// You can also add interceptors to handle responses globally
// e.g., redirecting to login on 401 Unauthorized errors
axiosInstance.interceptors.response.use(
  (response) => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    return response;
  },
  (error) => {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    console.error(
      "[AxiosInstance] Response interceptor error:",
      error.response?.status,
      error.response?.data
    );
    if (error.response?.status === 401) {
      // Handle unauthorized errors globally if desired
      console.error(
        "Unauthorized access - 401. Potentially redirecting to login."
      );
      // Example: Clear token and redirect (ensure this code only runs client-side)
      // localStorage.removeItem("adminAuthToken");
      // if (typeof window !== 'undefined') {
      //    window.location.href = '/admin/login'; // Adjust login path
      // }
    }
    return Promise.reject(error); // Pass the error along
  }
);

export { axiosInstance };
