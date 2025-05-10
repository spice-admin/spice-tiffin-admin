// src/services/order.service.ts (Admin Panel Frontend)
import type {
  ApiResponse,
  IOrderAdminFE, // Type for individual order in admin view
  IOrderFilters, // Type for filter object { status?, deliveryStatus?, search?, sortBy? }
  IPaginationData, // Type for { totalOrders, totalPages, currentPage, limit, hasNextPage, hasPrevPage }
  IAdminOrdersResponse, // Type for { orders: IOrderAdminFE[], pagination: IPaginationData }
} from "../types"; // Ensure these types are updated to match backend reality

// Constants
const API_BASE_URL = import.meta.env.PUBLIC_API_BASE_URL;
const ADMIN_ORDER_ENDPOINT = `${API_BASE_URL}/orders`; // This is the endpoint for general admin order operations

// Use the consistent token key we established
const ADMIN_AUTH_TOKEN_KEY = "token";

// Reusable response handler (looks okay, ensure it handles non-JSON responses gracefully if they are valid success cases)
async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  // Check for 204 No Content for delete operations specifically, before trying to parse JSON
  if (response.status === 204) {
    return {
      success: true,
      message: "Operation successful (No Content)",
      data: null as T,
    };
  }

  let data: any; // Use any initially, then cast to ApiResponse<T>
  try {
    data = await response.json();
  } catch (e) {
    // If parsing JSON fails but response was ok (e.g. 200 OK with empty body sometimes)
    if (response.ok) {
      // This case might be rare for GETs returning data, but good to consider
      return {
        success: true,
        message: "Operation successful (Empty Response Body)",
        data: undefined as T,
      };
    }
    // If response not ok and JSON parsing failed, construct error from status
    throw new Error(
      `HTTP error ${response.status}: ${response.statusText}. Response body was not valid JSON.`
    );
  }

  if (!response.ok) {
    console.error("API Error Response:", data); // Log the actual error response from backend
    throw new Error(data?.message || `HTTP error! Status: ${response.status}`);
  }
  // Assuming the backend always wraps its data in ApiResponse structure
  return data as ApiResponse<T>;
}

// Helper to get admin token
function getAuthAdminToken(): string | null {
  // Renamed for clarity
  if (typeof window !== "undefined") {
    return localStorage.getItem(ADMIN_AUTH_TOKEN_KEY); // Use consistent key
  }
  return null;
}

/**
 * Fetches orders for the Admin Panel with pagination and filtering.
 * Backend expects: GET /api/v1/admin/orders (this service uses ADMIN_ORDER_ENDPOINT which should map to this)
 */
export const getAllOrdersAdminApi = async (
  page: number = 1,
  limit: number = 10,
  filters: IOrderFilters = {} // IOrderFilters should include status, deliveryStatus, search, sortBy
): Promise<ApiResponse<IAdminOrdersResponse>> => {
  const token = getAuthAdminToken();
  if (!token) {
    return {
      success: false,
      message: "Admin authentication required.",
      data: undefined as any,
    }; // Ensure data type matches for error case
  }

  const params = new URLSearchParams();
  params.append("page", page.toString());
  params.append("limit", limit.toString());

  if (filters.status) {
    params.append("status", filters.status);
  }
  if (filters.deliveryStatus) {
    // New filter based on backend update
    params.append("deliveryStatus", filters.deliveryStatus);
  }
  if (filters.search && filters.search.trim() !== "") {
    params.append("search", filters.search.trim());
  }
  if (filters.sortBy) {
    // New filter based on backend update
    params.append("sortBy", filters.sortBy);
  }

  const url = `${ADMIN_ORDER_ENDPOINT}?${params.toString()}`;
  console.log(`[OrderServiceFE Admin] Fetching admin orders: ${url}`);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    // Backend response: { success: true, message: ..., count: itemsOnPage, data: { orders: [], pagination: {} } }
    return await handleResponse<IAdminOrdersResponse>(response);
  } catch (error) {
    console.error("Get All Orders Admin API failed:", error);
    return {
      success: false,
      message: (error as Error).message || "Failed to fetch orders.",
      data: undefined as any, // Ensure data type matches for error case
    };
  }
};

/**
 * Fetches a single order by ID for the Admin view.
 * Backend expects: GET /api/v1/admin/orders/:orderId
 */
export const getAdminOrderByIdApi = async (
  orderId: string
): Promise<ApiResponse<IOrderAdminFE>> => {
  const token = getAuthAdminToken();
  if (!token)
    return {
      success: false,
      message: "Admin authentication required.",
      data: undefined as any,
    };
  if (!orderId)
    return {
      success: false,
      message: "Order ID is required.",
      data: undefined as any,
    };

  const url = `${ADMIN_ORDER_ENDPOINT}/${orderId}`;
  console.log(`[OrderServiceFE Admin] Fetching admin order by ID: ${url}`);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    // Backend response: { success: true, data: order }
    return await handleResponse<IOrderAdminFE>(response);
  } catch (error) {
    console.error(`Get Admin Order By ID (${orderId}) failed:`, error);
    return {
      success: false,
      message: (error as Error).message || `Failed to fetch order ${orderId}.`,
      data: undefined as any,
    };
  }
};

/**
 * Updates an order via the Admin endpoint.
 * Backend expects: PUT or PATCH /api/v1/admin/orders/:orderId
 * Note: Your backend service `updateAdminOrder` handles both $set and $unset.
 * Frontend should send only the fields that are meant to be changed.
 */
export const updateAdminOrderApi = async (
  orderId: string,
  updateData: Partial<IOrderAdminFE> // Or a more specific IAdminOrderUpdatePayloadFE if types differ greatly
): Promise<ApiResponse<IOrderAdminFE>> => {
  const token = getAuthAdminToken();
  if (!token)
    return {
      success: false,
      message: "Admin authentication required.",
      data: undefined as any,
    };
  if (!orderId)
    return {
      success: false,
      message: "Order ID is required.",
      data: undefined as any,
    };
  if (!updateData || Object.keys(updateData).length === 0) {
    return {
      success: false,
      message: "No update data provided.",
      data: undefined as any,
    };
  }

  const url = `${ADMIN_ORDER_ENDPOINT}/${orderId}`;
  console.log(
    `[OrderServiceFE Admin] Updating admin order: ${url} with data:`,
    updateData
  );

  try {
    const response = await fetch(url, {
      method: "PUT", // Ensure backend route matches this method (PUT or PATCH)
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });
    // Backend response: { success: true, message: "...", data: updatedOrder }
    return await handleResponse<IOrderAdminFE>(response);
  } catch (error) {
    console.error(`Update Admin Order (${orderId}) failed:`, error);
    return {
      success: false,
      message: (error as Error).message || `Failed to update order ${orderId}.`,
      data: undefined as any,
    };
  }
};

/**
 * Deletes an order via the Admin endpoint.
 * Backend expects: DELETE /api/v1/admin/orders/:orderId
 */
export const deleteAdminOrderApi = async (
  orderId: string
): Promise<ApiResponse<null>> => {
  // Data is null on successful deletion
  const token = getAuthAdminToken();
  if (!token)
    return {
      success: false,
      message: "Admin authentication required.",
      data: null,
    };
  if (!orderId)
    return { success: false, message: "Order ID is required.", data: null };

  const url = `${ADMIN_ORDER_ENDPOINT}/${orderId}`;
  console.log(`[OrderServiceFE Admin] Deleting admin order: ${url}`);

  try {
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    // Backend response: { success: true, message: "..." } or 204 No Content
    // handleResponse is updated to handle 204
    return await handleResponse<null>(response);
  } catch (error) {
    console.error(`Delete Admin Order (${orderId}) failed:`, error);
    return {
      success: false,
      message: (error as Error).message || `Failed to delete order ${orderId}.`,
      data: null,
    };
  }
};
