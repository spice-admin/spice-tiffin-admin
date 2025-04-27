// src/services/packageService.ts
import type {
  ApiResponse,
  IPackageFE,
  IPackageFormData,
  ICategoryFE,
} from "../types";

// Ensure this points to your actual running backend
const API_BASE_URL =
  import.meta.env.PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";
const PACKAGES_ENDPOINT = `${API_BASE_URL}/packages`;
const CATEGORIES_ENDPOINT = `${API_BASE_URL}/categories`;

// Helper function for handling fetch responses
async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const data: ApiResponse<T> = await response.json();
  if (!response.ok) {
    console.error("API Error:", data.message, data.error);
    // Throw an error or return a structured error object
    throw new Error(data.message || `HTTP error! status: ${response.status}`);
  }
  return data;
}

// Fetch all packages
export const getAllPackages = async (): Promise<IPackageFE[]> => {
  try {
    const response = await fetch(PACKAGES_ENDPOINT);
    const result = await handleResponse<IPackageFE[]>(response);
    return result.data || []; // Return data or empty array
  } catch (error) {
    console.error("Failed to fetch packages:", error);
    // Depending on how you want to handle errors, you might re-throw,
    // return an empty array, or return an object indicating failure.
    throw error;
    //return [];
  }
};

// Create a new package
export const createPackage = async (
  packageData: IPackageFormData
): Promise<ApiResponse<IPackageFE>> => {
  try {
    const response = await fetch(PACKAGES_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(packageData),
    });
    return handleResponse<IPackageFE>(response);
  } catch (error) {
    console.error("Failed to create package:", error);
    return {
      success: false,
      message: (error as Error).message || "Failed to create package",
    };
  }
};

// Update an existing package
export const updatePackage = async (
  id: string,
  packageData: Partial<IPackageFormData>
): Promise<ApiResponse<IPackageFE>> => {
  try {
    const response = await fetch(`${PACKAGES_ENDPOINT}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(packageData),
    });
    return handleResponse<IPackageFE>(response);
  } catch (error) {
    console.error("Failed to update package:", error);
    return {
      success: false,
      message: (error as Error).message || "Failed to update package",
    };
  }
};

// Delete a package
export const deletePackage = async (id: string): Promise<ApiResponse<null>> => {
  try {
    const response = await fetch(`${PACKAGES_ENDPOINT}/${id}`, {
      method: "DELETE",
    });
    // Delete might return 200 OK with { success: true, message: ... } or 204 No Content
    // Adjust handleResponse or logic here if needed based on actual backend response
    if (response.status === 204) {
      return { success: true, message: "Package deleted successfully" };
    }
    return handleResponse<null>(response);
  } catch (error) {
    console.error("Failed to delete package:", error);
    return {
      success: false,
      message: (error as Error).message || "Failed to delete package",
    };
  }
};

export const getAllCategories = async (): Promise<ICategoryFE[]> => {
  try {
    console.log("FETCHING CATEGORIES from:", CATEGORIES_ENDPOINT); // <-- Add log
    const response = await fetch(CATEGORIES_ENDPOINT);
    const result = await handleResponse<ICategoryFE[]>(response);
    console.log("RECEIVED CATEGORIES:", result.data); // <-- Add log
    return result.data || [];
  } catch (error) {
    console.error("SERVICE ERROR fetching categories:", error); // <-- Add log
    throw error;
  }
};
