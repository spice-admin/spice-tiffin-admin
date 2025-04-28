// src/services/admin.service.ts (or similar)

import { axiosInstance } from "../lib/axiosInstance"; // Your configured axios instance
import type { IAdminGetActiveOrdersResponse } from "../types"; // Import the response type

/**
 * Fetches active orders for the Admin Panel.
 * Requires admin authentication token to be set in axiosInstance.
 */
export const getActiveOrdersForAdmin =
  async (): Promise<IAdminGetActiveOrdersResponse> => {
    try {
      // Get admin token from storage (e.g., localStorage or sessionStorage)
      // This logic might be handled globally by your axiosInstance interceptor
      const token = localStorage.getItem("token"); // Or sessionStorage
      if (!token) {
        throw new Error("Admin authentication token not found.");
      }

      console.log("[AdminService] Fetching active orders...");

      // Adjust endpoint if your base URL is handled by axiosInstance
      const response = await axiosInstance.get<IAdminGetActiveOrdersResponse>(
        "/admin/orders/active",
        {
          headers: {
            // Ensure the token is sent if not handled by an interceptor
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(
        `[AdminService] Successfully fetched ${response.data.count} active orders.`
      );
      return response.data;
    } catch (error: any) {
      console.error("[AdminService] Error fetching active orders:", error);
      // Rethrow or handle error as needed, ensuring a consistent error structure
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch active orders";
      // Construct a response matching the expected interface for consistency
      return {
        success: false,
        message: errorMessage,
        count: 0,
        data: [],
      };
    }
  };

// Add other admin-specific service functions here
