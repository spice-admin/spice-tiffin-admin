// src/utils/helpers.ts

/**
 * Format date to YYYY-MM-DD
 * @param dateString - Date string in ISO format
 * @returns Formatted date string or "N/A"
 */
export const formatDate = (dateString?: string | null): string => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (e) {
    console.error("Date formatting error:", e);
    return "Invalid Date";
  }
};

/**
 * Format currency in CAD
 * @param amount - Numeric amount
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number | null): string => {
  if (amount === null) return "N/A";
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(amount);
};

/**
 * Capitalize the first letter of a string
 * @param str - Input string
 * @returns Capitalized string
 */
export const capitalize = (str: string): string => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Convert enum value to display format
 * @param status - Enum value
 * @returns Formatted string
 */
export const formatOrderStatus = (status: string): string => {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
};
