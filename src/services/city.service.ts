// src/services/city.service.ts (Admin Panel Frontend)
import type { ApiResponse, ICityAdminFE, ICityFormData } from "../types";

// Constants
const API_BASE_URL =
  import.meta.env.PUBLIC_API_BASE_URL ||
  "https://spice-tiffin-backend-production.up.railway.app/api/v1";
const CITY_ENDPOINT = `${API_BASE_URL}/cities`; // Use the correct base path
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
  // Allow success:false through for specific handling if needed by caller
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
 * Fetches ALL cities for the Admin Panel.
 */
export const getAllCitiesAdminApi = async (): Promise<
  ApiResponse<ICityAdminFE[]>
> => {
  // Note: GET /cities might be public, but sending token anyway if needed later
  // const token = getAuthToken(); // Uncomment if GET needs auth
  // if (!token) return { success: false, message: "Admin authentication required." };

  try {
    const response = await fetch(`${CITY_ENDPOINT}/`, {
      // Calls GET /api/v1/cities
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // Add Authorization header if GET route is protected
        // 'Authorization': `Bearer ${token}`,
      },
    });
    return await handleResponse<ICityAdminFE[]>(response);
  } catch (error) {
    console.error("Get All Cities API failed:", error);
    return {
      success: false,
      message: (error as Error).message || "Failed to fetch cities.",
    };
  }
};

/**
 * Creates a new city. Requires Admin Auth.
 */
export const createCityAdminApi = async (
  formData: ICityFormData
): Promise<ApiResponse<ICityAdminFE>> => {
  const token = getAuthToken();
  if (!token)
    return { success: false, message: "Admin authentication required." };

  try {
    const response = await fetch(`${CITY_ENDPOINT}/`, {
      // Calls POST /api/v1/cities
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });
    return await handleResponse<ICityAdminFE>(response); // Expects created city data back
  } catch (error) {
    console.error("Create City API failed:", error);
    return {
      success: false,
      message: (error as Error).message || "Failed to create city.",
    };
  }
};

/**
 * Updates an existing city. Requires Admin Auth.
 */
export const updateCityAdminApi = async (
  cityId: string,
  formData: Partial<ICityFormData> // Use Partial as update might only send name
): Promise<ApiResponse<ICityAdminFE>> => {
  const token = getAuthToken();
  if (!token)
    return { success: false, message: "Admin authentication required." };

  if (!cityId)
    return { success: false, message: "City ID is required for update." };

  try {
    const response = await fetch(`${CITY_ENDPOINT}/${cityId}`, {
      // Calls PUT /api/v1/cities/:id
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });
    return await handleResponse<ICityAdminFE>(response); // Expects updated city data back
  } catch (error) {
    console.error("Update City API failed:", error);
    return {
      success: false,
      message: (error as Error).message || "Failed to update city.",
    };
  }
};

/**
 * Deletes a city. Requires Admin Auth.
 */
export const deleteCityAdminApi = async (
  cityId: string
): Promise<ApiResponse<null>> => {
  // Usually returns no data on success
  const token = getAuthToken();
  if (!token)
    return { success: false, message: "Admin authentication required." };

  if (!cityId)
    return { success: false, message: "City ID is required for deletion." };

  try {
    const response = await fetch(`${CITY_ENDPOINT}/${cityId}`, {
      // Calls DELETE /api/v1/cities/:id
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    // Handle 204 No Content specifically if backend does that for DELETE
    if (response.status === 204) {
      return { success: true, message: "City deleted successfully" };
    }
    // Otherwise, parse the JSON response (e.g., for { success: true, message: ... })
    return await handleResponse<null>(response);
  } catch (error) {
    console.error("Delete City API failed:", error);
    return {
      success: false,
      message: (error as Error).message || "Failed to delete city.",
    };
  }
};
