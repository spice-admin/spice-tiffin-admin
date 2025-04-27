// src/services/customer.service.ts (Admin Panel Frontend)
import type { ApiResponse, ICustomerAdminFE } from "../types"; // Import relevant types

// Constants
const API_BASE_URL =
  import.meta.env.PUBLIC_API_BASE_URL ||
  "https://spice-tiffin-backend-production.up.railway.app/api/v1";
// Use the correct endpoint based on your backend routes
const ADMIN_ENDPOINT = `${API_BASE_URL}/admin`;
const AUTH_TOKEN_KEY = "token"; // Use the key where admin token is stored

// Reusable response handler (Copy or import from shared utils)
async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  let data: ApiResponse<T>;
  try {
    data = await response.json();
  } catch (e) {
    if (!response.ok) {
      throw new Error(
        `HTTP error ${response.status}: ${response.statusText}. Non-JSON response.`
      );
    }
    data = { success: true, message: "OK (non-JSON)", data: undefined as T };
  }
  if (!response.ok) {
    console.error("API Error:", data);
    throw new Error(data?.message || `HTTP error! Status: ${response.status}`);
  }
  return data;
}

// Helper to get admin token
function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }
  return null;
}

/**
 * Fetches ALL customers for the Admin Panel.
 * @returns Promise<ApiResponse<ICustomerAdminFE[]>>
 */
export const getAllCustomersAdminApi = async (): Promise<
  ApiResponse<ICustomerAdminFE[]>
> => {
  const token = getAuthToken();
  if (!token) {
    return { success: false, message: "Admin authentication required." };
  }

  try {
    // Call the new backend endpoint
    const response = await fetch(`${ADMIN_ENDPOINT}/customers`, {
      // Calls GET /api/v1/admin/customers
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`, // Send the ADMIN JWT
        "Content-Type": "application/json",
      },
    });
    // Expects { success: true, data: [customers], count: X } on success
    return await handleResponse<ICustomerAdminFE[]>(response);
  } catch (error) {
    console.error("Get All Customers API failed:", error);
    return {
      success: false,
      message: (error as Error).message || "Failed to fetch customers.",
    };
  }
};

// Add other admin customer functions later (update status, delete, etc.)
