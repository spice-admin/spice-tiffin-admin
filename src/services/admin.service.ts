// src/services/admin.service.ts (or similar)

import { axiosInstance } from "../lib/axiosInstance"; // Your configured axios instance
import type {
  IAdminGetActiveOrdersResponse,
  ApiResponse,
  IOrderAdminFE,
  IDriverFE,
} from "../types"; // Import the response type

const API_BASE_URL =
  import.meta.env.PUBLIC_API_BASE_URL ||
  "https://spice-tiffin-backend-production.up.railway.app/api/v1"; // Use Admin's env var
const ADMIN_ENDPOINT_BASE = `${API_BASE_URL}/admin`;
const ASSIGNMENT_ENDPOINT = `${ADMIN_ENDPOINT_BASE}/assignments`;
const ROUTE_ENDPOINT = `${ADMIN_ENDPOINT_BASE}/routes`;
const AUTH_TOKEN_KEY = "token"; // Ensure this matches the key used in Admin LoginForm

// --- Reusable Helper Functions (Copy or Import from shared utils) ---

// Helper to get admin token
function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }
  return null;
}

async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  let data: ApiResponse<T>;
  const contentType = response.headers.get("content-type");

  try {
    if (response.status === 204) {
      // Handle No Content
      return { success: true, message: "Operation successful (No Content)" };
    }
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const textData = await response.text();
      if (!response.ok) {
        throw new Error(
          textData || `HTTP error ${response.status}: ${response.statusText}`
        );
      }
      data = { success: true, message: textData || "OK", data: undefined as T };
    }
  } catch (e) {
    console.error("Error processing response body:", e);
    if (!response.ok) {
      throw new Error(
        `HTTP error ${response.status}: ${response.statusText}. Response body processing failed.`
      );
    }
    data = {
      success: true,
      message: "OK (Response body processing failed)",
      data: undefined as T,
    };
  }

  if (!response.ok) {
    console.error("API Error Response:", data || `Status: ${response.status}`);
    throw new Error(data?.message || `HTTP error! Status: ${response.status}`);
  }
  return data;
}

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

/**
 * Fetches assignable orders for the Admin Panel.
 * Calls GET /api/v1/admin/orders/assignable
 * @returns Promise<ApiResponse<IOrderAdminFE[]>>
 */
export const getAssignableOrdersAdminApi = async (): Promise<
  ApiResponse<IOrderAdminFE[]>
> => {
  const token = getAuthToken();
  if (!token) {
    // Return error structure consistent with handleResponse failure
    return {
      success: false,
      message: "Admin authentication required.",
      data: [],
    };
  }

  try {
    console.log("[AdminService Fetch] Fetching assignable orders...");
    const response = await fetch(`${ADMIN_ENDPOINT_BASE}/orders/assignable`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const result = await handleResponse<IOrderAdminFE[]>(response);
    // Ensure data is always an array on success
    const dataArray = Array.isArray(result.data) ? result.data : [];
    console.log(
      `[AdminService Fetch] Found ${
        result.count ?? dataArray.length
      } assignable orders.`
    );

    return {
      ...result, // success, message, count
      data: dataArray,
    };
  } catch (error) {
    console.error(
      "[AdminService Fetch] Get Assignable Orders API failed:",
      error
    );
    return {
      success: false,
      message: (error as Error).message || "Failed to fetch assignable orders.",
      data: [], // Return empty array on error
    };
  }
};

/**
 * Fetches active drivers for the Admin Panel.
 * Calls GET /api/v1/admin/drivers/active
 * @returns Promise<ApiResponse<IDriverFE[]>>
 */
export const getActiveDriversAdminApi = async (): Promise<
  ApiResponse<IDriverFE[]>
> => {
  const token = getAuthToken();
  if (!token) {
    return {
      success: false,
      message: "Admin authentication required.",
      data: [],
    };
  }

  try {
    console.log("[AdminService Fetch] Fetching active drivers...");
    const response = await fetch(`${ADMIN_ENDPOINT_BASE}/drivers/active`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const result = await handleResponse<IDriverFE[]>(response);
    // Ensure data is always an array on success
    const dataArray = Array.isArray(result.data) ? result.data : [];
    console.log(
      `[AdminService Fetch] Found ${
        result.count ?? dataArray.length
      } active drivers.`
    );

    return {
      ...result, // success, message, count
      data: dataArray,
    };
  } catch (error) {
    console.error("[AdminService Fetch] Get Active Drivers API failed:", error);
    return {
      success: false,
      message: (error as Error).message || "Failed to fetch active drivers.",
      data: [], // Return empty array on error
    };
  }
};

/**
 * Fetches orders assigned to a specific driver.
 * Calls GET /api/v1/admin/assignments?driverId=<driverId>
 * @param driverId - The ID of the driver whose orders to fetch.
 * @returns Promise<ApiResponse<IOrderAdminFE[]>>
 */
export const getAssignedOrdersForDriverApi = async (
  driverId: string
): Promise<ApiResponse<IOrderAdminFE[]>> => {
  const token = getAuthToken();
  if (!token) {
    return {
      success: false,
      message: "Admin authentication required.",
      data: [],
    };
  }
  if (!driverId) {
    return { success: false, message: "Driver ID is required.", data: [] };
  }

  try {
    console.log(
      `[AdminService Fetch] Fetching assigned orders for driver ${driverId}...`
    );
    // Construct URL with query parameter
    const url = new URL(ASSIGNMENT_ENDPOINT); // Ensure ASSIGNMENT_ENDPOINT is defined correctly
    url.searchParams.append("driverId", driverId);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const result = await handleResponse<IOrderAdminFE[]>(response);
    const dataArray = Array.isArray(result.data) ? result.data : [];
    console.log(
      `[AdminService Fetch] Found ${
        result.count ?? dataArray.length
      } assigned orders for driver ${driverId}.`
    );

    return { ...result, data: dataArray };
  } catch (error) {
    console.error(
      `[AdminService Fetch] Get Assigned Orders API failed for driver ${driverId}:`,
      error
    );
    return {
      success: false,
      message: (error as Error).message || "Failed to fetch assigned orders.",
      data: [],
    };
  }
};

/**
 * Assigns selected orders to a specific driver.
 * Calls POST /api/v1/admin/assignments
 * @param driverId - The ID of the driver to assign orders to.
 * @param orderIds - An array of order IDs to be assigned.
 * @returns Promise<ApiResponse<null>> - Expects no specific data back on success.
 */
export const assignOrdersToDriverApi = async (
  driverId: string,
  orderIds: string[]
): Promise<ApiResponse<null>> => {
  const token = getAuthToken();
  if (!token) {
    return { success: false, message: "Admin authentication required." };
  }
  if (!driverId || !orderIds || orderIds.length === 0) {
    return {
      success: false,
      message: "Driver ID and at least one Order ID are required.",
    };
  }

  try {
    console.log(
      `[AdminService Fetch] Assigning ${orderIds.length} orders to driver ${driverId}...`
    );

    const response = await fetch(ASSIGNMENT_ENDPOINT, {
      // POST to the base assignment endpoint
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ driverId, orderIds }), // Send driverId and orderIds in the body
    });

    // Use handleResponse, expecting no specific data (T = null) on success
    const result = await handleResponse<null>(response);
    console.log(
      `[AdminService Fetch] Assignment response for driver ${driverId}:`,
      result.message
    );
    return result; // Return the { success, message } object
  } catch (error) {
    console.error(
      `[AdminService Fetch] Assign Orders API failed for driver ${driverId}:`,
      error
    );
    return {
      success: false,
      message: (error as Error).message || "Failed to assign orders.",
    };
  }
};

/**
 * Requests route optimization for a specific driver's assigned orders.
 * Calls POST /api/v1/admin/routes/optimize
 * @param driverId - The ID of the driver whose route needs optimization.
 * @param orderIds - Optional: Array of specific order IDs to optimize (if not optimizing all assigned).
 * @returns Promise<ApiResponse<{ sequencedOrderIds?: string[] } | null>> - Backend might return the sequence.
 */
export const optimizeRouteApi = async (
  driverId: string,
  orderIds?: string[]
): Promise<ApiResponse<{ sequencedOrderIds?: string[] } | null>> => {
  const token = getAuthToken();
  if (!token) {
    return { success: false, message: "Admin authentication required." };
  }
  if (!driverId) {
    return {
      success: false,
      message: "Driver ID is required for route optimization.",
    };
  }

  try {
    console.log(
      `[AdminService Fetch] Optimizing route for driver ${driverId}...`
    );

    // Prepare request body - backend might just need driverId or specific orderIds
    const requestBody = {
      driverId: driverId,
      // Conditionally include orderIds if provided
      ...(orderIds && orderIds.length > 0 && { orderIds: orderIds }),
    };

    const response = await fetch(`${ROUTE_ENDPOINT}/optimize`, {
      // POST to the optimize endpoint
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    // Expects { success: true, message: ..., data: { sequencedOrderIds: [...] } } on success
    const result = await handleResponse<{
      sequencedOrderIds?: string[];
    } | null>(response);
    console.log(
      `[AdminService Fetch] Optimization response for driver ${driverId}:`,
      result.message
    );
    return result;
  } catch (error) {
    console.error(
      `[AdminService Fetch] Optimize Route API failed for driver ${driverId}:`,
      error
    );
    return {
      success: false,
      message: (error as Error).message || "Failed to optimize route.",
      data: null,
    };
  }
};
