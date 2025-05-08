// src/utils/date.ts

/**
 * Formats a Date object or a date string into a readable format (e.g., "May 8, 2025").
 * Uses the 'en-CA' locale for consistency and formats based on the local date interpretation.
 * Handles invalid dates gracefully.
 *
 * @param dateInput - The Date object or string (ideally ISO format) to format.
 * @param options - Optional Intl.DateTimeFormatOptions to customize output.
 * @returns Formatted date string, 'Invalid Date', or 'N/A'.
 */
export const formatDate = (
  dateInput: string | Date | undefined | null,
  options?: Intl.DateTimeFormatOptions
): string => {
  if (!dateInput) return "N/A"; // Handle null/undefined

  try {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);

    // Check if the date object is valid
    if (isNaN(date.getTime())) {
      console.warn("formatDate received an invalid date input:", dateInput);
      return "Invalid Date";
    }

    // Default formatting options
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short", // e.g., 'May'
      day: "numeric",
      // DO NOT specify timeZone here to use local interpretation
    };

    // Merge default options with any provided options
    const formatOptions = { ...defaultOptions, ...options };

    return date.toLocaleDateString("en-CA", formatOptions); // Use Canadian English locale
  } catch (e) {
    console.error("Error formatting date:", dateInput, e);
    return "Invalid Date";
  }
};

/**
 * Formats a Date object or a date string specifically for HTML input type="date" (YYYY-MM-DD).
 * IMPORTANT: This extracts date parts based on the UTC representation of the date object
 * to avoid off-by-one errors when converting dates across timezones for simple date input binding.
 *
 * @param dateInput - The Date object or string (ideally ISO format).
 * @returns Date string in 'YYYY-MM-DD' format, or empty string if invalid.
 */
export const formatDateForInput = (
  dateInput: string | Date | undefined | null
): string => {
  if (!dateInput) return "";
  try {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(date.getTime())) {
      return "";
    }
    // Use UTC methods to get date parts independent of local timezone offset
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, "0"); // Month is 0-indexed
    const day = date.getUTCDate().toString().padStart(2, "0");

    return `${year}-${month}-${day}`;
  } catch (e) {
    console.error("Error formatting date for input:", dateInput, e);
    return "";
  }
};

// You can add other date utility functions here later if needed
