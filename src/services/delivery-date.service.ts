// src/services/delivery-date.service.ts (FRONTEND - Admin Panel)
import type { ApiResponse, IDeliveryDateSettingFE } from "../types";

const API_BASE_URL = import.meta.env.PUBLIC_API_BASE_URL;
const ADMIN_ENDPOINT = `${API_BASE_URL}/admin/delivery-dates`;
const PUBLIC_ENDPOINT = `${API_BASE_URL}/delivery-dates`;
const AUTH_TOKEN_KEY = "token";

// Type for the data returned for a specific month
export interface IDeliveryDateSettingFE {
  date: string; // Expecting ISO string (YYYY-MM-DD or full ISO)
  isEnabled: boolean;
  notes?: string;
}

function getAuthToken(): string | null {
  // Ensure this code runs only on the client-side
  if (typeof window !== "undefined" && window.localStorage) {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }
  // Optional: Log warning if called in non-browser environment
  // console.warn("getAuthToken called in non-browser environment.");
  return null;
}

async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  let data: ApiResponse<T>; // Declare data variable
  const contentType = response.headers.get("content-type");

  // Check if response is ok first
  if (!response.ok) {
    // Try to parse error json from backend
    try {
      // Only parse if JSON content type is present
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        // Otherwise, use text for error message
        const textError = await response.text();
        throw new Error(
          textError || `HTTP error ${response.status}: ${response.statusText}`
        );
      }
      console.error("API Error Response:", data);
      throw new Error(
        data?.message || `HTTP error! Status: ${response.status}`
      );
    } catch (e: any) {
      // Catch parsing errors or thrown error
      console.error(
        "API Error: Could not parse response body or error occurred.",
        response.status,
        response.statusText
      );
      // If error already has message (from text() or json() failure), use it
      throw new Error(
        e?.message ||
          `HTTP error! Status: ${response.status} ${response.statusText}.`
      );
    }
  }

  // If response IS ok (2xx status)
  try {
    // Handle 204 No Content specifically
    if (response.status === 204) {
      return { success: true, message: "Operation successful (No Content)" };
    }
    // Check content type before parsing JSON
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
      // Optional: Check for explicit success: false even with 2xx status
      // if (data.success === false) { throw new Error(data.message || 'API returned success: false.'); }
    } else {
      // Handle successful non-JSON responses if necessary (e.g., plain text OK message)
      const textData = await response.text();
      console.warn("API Success: Response body was not JSON.", textData);
      data = { success: true, message: textData || "OK", data: undefined as T };
    }
  } catch (e) {
    // Catch JSON parsing errors on successful responses (less common)
    console.error("Error processing successful response body:", e);
    // Decide how to handle this - return default success or throw?
    // Returning default success might hide issues. Throwing might be better.
    throw new Error(
      `Failed to parse successful response body: ${(e as Error).message}`
    );
    // Or: data = { success: true, message: "OK (Response body processing failed)", data: undefined as T };
  }

  return data; // Return the structured { success, message, data?, ... } object
}

/**
 * Fetches delivery date settings for a specific month/year (Admin).
 * GET /api/v1/admin/delivery-dates?year=YYYY&month=M
 */
export const getAdminDeliverySettingsApi = async (
  year: number,
  month: number
): Promise<ApiResponse<IDeliveryDateSettingFE[]>> => {
  const token = getAuthToken();
  if (!token)
    return { success: false, message: "Admin authentication required." };

  const params = new URLSearchParams({
    year: year.toString(),
    month: month.toString(),
  });
  const url = `${ADMIN_ENDPOINT}?${params.toString()}`;
  console.log(`[DeliveryDateServiceFE] Fetching settings: ${url}`);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    // Expects { success: true, data: [{ date, isEnabled }, ...] }
    return await handleResponse<IDeliveryDateSettingFE[]>(response);
  } catch (error) {
    console.error("Get Admin Delivery Settings API failed:", error);
    return {
      success: false,
      message: (error as Error).message || "Failed to fetch settings.",
    };
  }
};

/**
 * Updates the setting for a single delivery date (Admin).
 * PUT /api/v1/admin/delivery-dates
 */
export const updateAdminDeliverySettingApi = async (
  date: Date | string, // Can accept Date object or ISO string
  isEnabled: boolean,
  notes?: string // Optional notes
): Promise<ApiResponse<IDeliveryDateSettingFE>> => {
  const token = AUTH_TOKEN_KEY;
  if (!token)
    return { success: false, message: "Admin authentication required." };

  // Ensure date is in a consistent string format (e.g., YYYY-MM-DD) if needed by backend
  const dateString =
    date instanceof Date ? date.toISOString().split("T")[0] : date;

  const payload: { date: string; isEnabled: boolean; notes?: string } = {
    date: dateString,
    isEnabled: isEnabled,
  };
  if (notes !== undefined) payload.notes = notes;

  console.log(
    `[DeliveryDateServiceFE] Updating setting for: ${dateString} to ${isEnabled}`
  );

  try {
    const response = await fetch(ADMIN_ENDPOINT, {
      // Uses base endpoint for PUT
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    // Expects { success: true, data: updatedSetting }
    return await handleResponse<IDeliveryDateSettingFE>(response);
  } catch (error) {
    console.error("Update Admin Delivery Setting API failed:", error);
    return {
      success: false,
      message: (error as Error).message || "Failed to update setting.",
    };
  }
};

// Keep getPublicAvailableDates if needed for customer app later
// export const getPublicAvailableDatesApi = async (...) => { ... }
