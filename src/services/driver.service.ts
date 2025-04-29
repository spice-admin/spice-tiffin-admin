// src/services/driver.service.ts

import type { ApiResponse, IDriverFE, IDriverFormData } from "../types"; // Adjust path

// Constants
const API_BASE_URL = import.meta.env.PUBLIC_API_BASE_URL; // Use Admin's env var
const DRIVER_ENDPOINT = `${API_BASE_URL}/drivers`; // Endpoint for drivers
const AUTH_TOKEN_KEY = "token"; // Ensure this matches the key used in LoginForm

// Reusable response handler (copied from order.service.ts example)
async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  let data: ApiResponse<T>;
  const contentType = response.headers.get("content-type");

  try {
    // Handle 204 No Content specifically for DELETE success
    if (response.status === 204) {
      return { success: true, message: "Operation successful (No Content)" };
    }
    // Check if response is JSON before parsing
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      // Handle non-JSON responses (e.g., plain text error messages)
      const textData = await response.text();
      if (!response.ok) {
        throw new Error(
          textData || `HTTP error ${response.status}: ${response.statusText}`
        );
      }
      // Success but non-JSON response (less common for APIs returning data)
      data = { success: true, message: textData || "OK", data: undefined as T };
    }
  } catch (e) {
    // Catch JSON parsing errors or errors from reading text
    console.error("Error processing response body:", e);
    if (!response.ok) {
      // If parsing failed but status indicates error, throw generic HTTP error
      throw new Error(
        `HTTP error ${response.status}: ${response.statusText}. Response body processing failed.`
      );
    }
    // If parsing failed but status is ok (unlikely), treat as success with warning
    data = {
      success: true,
      message: "OK (Response body processing failed)",
      data: undefined as T,
    };
  }

  if (!response.ok) {
    console.error("API Error Response:", data || `Status: ${response.status}`);
    // Use message from parsed data if available, otherwise construct error
    throw new Error(data?.message || `HTTP error! Status: ${response.status}`);
  }
  return data; // Return the structured { success, message, data?, ... } object
}

// Helper to get admin token
function getAuthToken(): string | null {
  // Ensure this code runs only on the client-side
  if (typeof window !== "undefined") {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }
  return null;
}

/**
 * Fetches ALL drivers for the Admin Panel.
 * @returns Promise<ApiResponse<IDriverFE[]>>
 */
export const getAllDrivers = async (): Promise<ApiResponse<IDriverFE[]>> => {
  const token = getAuthToken();
  if (!token) {
    return {
      success: false,
      message: "Admin authentication required.",
      data: [],
    }; // Return empty data array on auth failure
  }

  try {
    console.log("[DriverService Fetch] Fetching all drivers...");
    const response = await fetch(`${DRIVER_ENDPOINT}/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    // Process response using handleResponse
    const result = await handleResponse<IDriverFE[]>(response);

    // Ensure the data property is always an array on success
    const dataArray = Array.isArray(result.data) ? result.data : [];

    console.log(
      `[DriverService Fetch] Found ${result.count ?? dataArray.length} drivers.`
    );

    // Return the result object, ensuring data is an array
    const successResponse = {
      // <--- Define success response
      ...result,
      data: dataArray,
    };
    // <--- ADD LOG HERE
    return successResponse;
  } catch (error) {
    const errorResponse = {
      // <--- Define error response
      success: false,
      message: (error as Error).message || "Failed to fetch drivers.",
      data: [], // Return empty data array on fetch failure
    };
    console.log("!!! Service Returning ERROR:", JSON.stringify(errorResponse));
    return errorResponse;
  }
};

/**
 * Creates a new driver.
 * @param driverData - Data for the new driver.
 * @returns Promise<ApiResponse<IDriverFE>>
 */
export const createDriver = async (
  driverData: IDriverFormData
): Promise<ApiResponse<IDriverFE>> => {
  const token = getAuthToken();
  if (!token) {
    return { success: false, message: "Admin authentication required." };
  }
  // Ensure password is provided for creation
  if (!driverData.password) {
    return {
      success: false,
      message: "Password is required to create a driver.",
    };
  }

  try {
    console.log("[DriverService Fetch] Creating new driver:", driverData.phone);
    const response = await fetch(`${DRIVER_ENDPOINT}/`, {
      // Calls POST /api/v1/drivers
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(driverData),
    });
    // Expects { success: true, data: newDriver } on success (newDriver excludes password)
    const result = await handleResponse<IDriverFE>(response);
    console.log("[DriverService Fetch] Create response:", result.message);
    return result;
  } catch (error) {
    console.error("[DriverService Fetch] Create Driver API failed:", error);
    return {
      success: false,
      message: (error as Error).message || "Failed to create driver.",
    };
  }
};

/**
 * Updates an existing driver.
 * @param id - The ID of the driver to update.
 * @param driverData - Partial data containing updates. Password only if changing.
 * @returns Promise<ApiResponse<IDriverFE>>
 */
export const updateDriver = async (
  id: string,
  driverData: Partial<IDriverFormData>
): Promise<ApiResponse<IDriverFE>> => {
  const token = getAuthToken();
  if (!token) {
    return { success: false, message: "Admin authentication required." };
  }
  // If password field is present but empty, remove it, otherwise backend validation might fail
  // The backend model hook handles hashing if password field is present and has value
  if (driverData.password !== undefined && driverData.password === "") {
    delete driverData.password;
  }

  try {
    console.log(
      `[DriverService Fetch] Updating driver ${id} with:`,
      driverData
    );
    const response = await fetch(`${DRIVER_ENDPOINT}/${id}`, {
      // Calls PATCH /api/v1/drivers/:id
      method: "PATCH", // Use PATCH for partial updates
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(driverData),
    });
    // Expects { success: true, data: updatedDriver } on success (updatedDriver excludes password)
    const result = await handleResponse<IDriverFE>(response);
    console.log("[DriverService Fetch] Update response:", result.message);
    return result;
  } catch (error) {
    console.error(
      `[DriverService Fetch] Update Driver API failed for ${id}:`,
      error
    );
    return {
      success: false,
      message: (error as Error).message || `Failed to update driver ${id}.`,
    };
  }
};

/**
 * Deletes a driver.
 * @param id - The ID of the driver to delete.
 * @returns Promise<ApiResponse<null>> - Data is typically null on successful delete.
 */
export const deleteDriver = async (id: string): Promise<ApiResponse<null>> => {
  const token = getAuthToken();
  if (!token) {
    return { success: false, message: "Admin authentication required." };
  }

  try {
    console.log(`[DriverService Fetch] Deleting driver ${id}...`);
    const response = await fetch(`${DRIVER_ENDPOINT}/${id}`, {
      // Calls DELETE /api/v1/drivers/:id
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    // Expects 204 No Content or potentially 200 OK with { success: true, message: ... }
    // handleResponse is updated to handle 204
    const result = await handleResponse<null>(response); // Expect no data body on success
    console.log(
      `[DriverService Fetch] Delete response status for ${id}: ${response.status}`
    );
    return {
      // Ensure consistent return structure even for 204
      success: result.success,
      message: result.message || "Driver deleted successfully.",
    };
  } catch (error) {
    console.error(
      `[DriverService Fetch] Delete Driver API failed for ${id}:`,
      error
    );
    return {
      success: false,
      message: (error as Error).message || `Failed to delete driver ${id}.`,
    };
  }
};
