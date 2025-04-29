// src/services/order.service.ts (Admin Panel Frontend)
import type { ApiResponse, IOrderAdminFE } from "../types";

// Constants (use Admin Panel's token key if different)
const API_BASE_URL = import.meta.env.PUBLIC_API_BASE_URL; // Use Admin's env var
const ORDER_ENDPOINT = `${API_BASE_URL}/orders`;
const AUTH_TOKEN_KEY = "token";

// Reusable response handler
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
 * Fetches ALL orders for the Admin Panel.
 * @returns Promise<ApiResponse<IOrderAdminFE[]>>
 */
export const getAllOrdersAdminApi = async (): Promise<
  ApiResponse<IOrderAdminFE[]>
> => {
  const token = getAuthToken();
  if (!token) {
    return { success: false, message: "Admin authentication required." };
  }

  try {
    const response = await fetch(`${ORDER_ENDPOINT}/`, {
      // Calls GET /api/v1/orders
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`, // Send the ADMIN JWT
        "Content-Type": "application/json",
      },
    });
    // Expects { success: true, data: [orders], count: X } on success
    return await handleResponse<IOrderAdminFE[]>(response);
  } catch (error) {
    console.error("Get All Orders API failed:", error);
    return {
      success: false,
      message: (error as Error).message || "Failed to fetch orders.",
    };
  }
};
