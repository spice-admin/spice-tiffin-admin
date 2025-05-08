// src/services/order.service.ts (Admin Panel Frontend)
import type {
  ApiResponse,
  IOrderAdminFE, // Type for individual order in admin view
  IOrderFilters, // Type for filter object { status?, search? }
  IPaginationData, // Type for { totalOrders, totalPages, currentPage, ... }
  IAdminOrdersResponse, // Type for { orders: IOrderAdminFE[], pagination: IPaginationData }
} from "../types";

// Constants (use Admin Panel's token key if different)
const API_BASE_URL = import.meta.env.PUBLIC_API_BASE_URL; // Use Admin's env var
const ADMIN_ORDER_ENDPOINT = `${API_BASE_URL}/admin/orders`;
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

// --- CORRECTED VERSION of getAllOrdersAdminApi ---
/**
 * Fetches orders for the Admin Panel with pagination and filtering.
 * @param page Current page number
 * @param limit Items per page
 * @param filters Object containing filter criteria { status?, search? }
 * @returns Promise<ApiResponse<IAdminOrdersResponse>> - Expects { orders, pagination } in data
 */
export const getAllOrdersAdminApi = async (
  page: number = 1,
  limit: number = 10, // Default limit (should match ITEMS_PER_PAGE in wrapper)
  filters: IOrderFilters = {}
): Promise<ApiResponse<IAdminOrdersResponse>> => {
  // <-- Correct Return Type
  const token = getAuthToken();
  if (!token)
    return { success: false, message: "Admin authentication required." };

  // Construct query parameters
  const params = new URLSearchParams();
  params.append("page", page.toString());
  params.append("limit", limit.toString());
  // Add filters if they have values
  if (filters.status) {
    params.append("status", filters.status);
  }
  if (filters.search && filters.search.trim() !== "") {
    // Check search is not empty
    params.append("search", filters.search.trim());
  }
  // Add other filter params... e.g. date ranges if implemented

  // Use the ADMIN endpoint and append query params
  const url = `${ADMIN_ORDER_ENDPOINT}?${params.toString()}`;
  console.log(`[OrderServiceFE] Fetching admin orders: ${url}`);

  try {
    const response = await fetch(url, {
      // Use the URL with params
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    // Expects { success: true, data: { orders: [], pagination: {...} } }
    // Pass the correct expected nested type to handleResponse
    return await handleResponse<IAdminOrdersResponse>(response); // <-- Correct Expected Type
  } catch (error) {
    console.error("Get All Orders Admin API failed:", error);
    return {
      success: false,
      message: (error as Error).message || "Failed to fetch orders.",
      // data: undefined // Ensure data is not set on error
    };
  }
};

/**
 * Fetches a single order by ID for the Admin view.
 * Assumes backend populates necessary details (customer, package, driver).
 * Calls GET /api/v1/admin/orders/:orderId
 * @param orderId The ID of the order.
 * @returns Promise<ApiResponse<IOrderAdminFE>>
 */
export const getAdminOrderByIdApi = async (
  orderId: string
): Promise<ApiResponse<IOrderAdminFE>> => {
  const token = getAuthToken();
  if (!token)
    return { success: false, message: "Admin authentication required." };
  if (!orderId) return { success: false, message: "Order ID is required." };

  const url = `${ADMIN_ORDER_ENDPOINT}/${orderId}`; // Use admin endpoint + ID
  console.log(`[OrderServiceFE] Fetching admin order: ${url}`);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    // Expects { success: true, data: populatedOrder }
    return await handleResponse<IOrderAdminFE>(response);
  } catch (error) {
    console.error(`Get Admin Order By ID (${orderId}) failed:`, error);
    return {
      success: false,
      message: (error as Error).message || `Failed to fetch order ${orderId}.`,
    };
  }
};

/**
 * Updates an order via the Admin endpoint.
 * Calls PUT /api/v1/admin/orders/:orderId
 * @param orderId The ID of the order to update.
 * @param updateData An object containing ONLY the fields to be updated.
 * @returns Promise<ApiResponse<IOrderAdminFE>> - Returns the updated order data.
 */
export const updateAdminOrderApi = async (
  orderId: string,
  updateData: Partial<IOrderAdminFE> // Send only fields intended for update
): Promise<ApiResponse<IOrderAdminFE>> => {
  const token = getAuthToken();
  if (!token)
    return { success: false, message: "Admin authentication required." };
  if (!orderId) return { success: false, message: "Order ID is required." };
  if (!updateData || Object.keys(updateData).length === 0) {
    return { success: false, message: "No update data provided." };
  }

  const url = `${ADMIN_ORDER_ENDPOINT}/${orderId}`; // Use admin endpoint + ID
  console.log(
    `[OrderServiceFE] Updating admin order: ${url} with data:`,
    updateData
  );

  try {
    const response = await fetch(url, {
      method: "PUT", // Or PATCH if your backend uses that
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });
    // Expects { success: true, message: "...", data: updatedPopulatedOrder }
    return await handleResponse<IOrderAdminFE>(response);
  } catch (error) {
    console.error(`Update Admin Order (${orderId}) failed:`, error);
    return {
      success: false,
      message: (error as Error).message || `Failed to update order ${orderId}.`,
    };
  }
};

/**
 * Deletes an order via the Admin endpoint.
 * Calls DELETE /api/v1/admin/orders/:orderId
 * @param orderId The ID of the order to delete.
 * @returns Promise<ApiResponse<null>> - Often returns no data on success.
 */
export const deleteAdminOrderApi = async (
  orderId: string
): Promise<ApiResponse<null>> => {
  const token = getAuthToken();
  if (!token)
    return { success: false, message: "Admin authentication required." };
  if (!orderId) return { success: false, message: "Order ID is required." };

  const url = `${ADMIN_ORDER_ENDPOINT}/${orderId}`; // Use admin endpoint + ID
  console.log(`[OrderServiceFE] Deleting admin order: ${url}`);

  try {
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    // Expects { success: true, message: "..." } or maybe 204 No Content
    return await handleResponse<null>(response); // Expecting null data on success
  } catch (error) {
    console.error(`Delete Admin Order (${orderId}) failed:`, error);
    return {
      success: false,
      message: (error as Error).message || `Failed to delete order ${orderId}.`,
    };
  }
};
