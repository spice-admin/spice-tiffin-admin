// src/utils/currency.ts

/**
 * Formats a number as Canadian Dollar (CAD) currency.
 *
 * @param amount - The numeric value to format (assumed to be in dollars).
 * @param options - Optional Intl.NumberFormatOptions to override defaults.
 * @returns Formatted currency string (e.g., "$19.99"), or empty string if input is invalid.
 */
export const formatCurrencyCAD = (
  amount: number | undefined | null,
  options?: Intl.NumberFormatOptions
): string => {
  // Handle null, undefined, or non-numeric input gracefully
  if (
    amount === null ||
    amount === undefined ||
    typeof amount !== "number" ||
    isNaN(amount)
  ) {
    console.warn("formatCurrencyCAD received invalid input:", amount);
    return ""; // Or return "$0.00", or throw error depending on desired behavior
  }

  try {
    // Default formatting options for CAD
    const defaultOptions: Intl.NumberFormatOptions = {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 2, // Always show cents
      maximumFractionDigits: 2,
    };

    // Merge default options with any provided options
    const formatOptions = { ...defaultOptions, ...options };

    return new Intl.NumberFormat("en-CA", formatOptions).format(amount); // Use Canadian English locale
  } catch (e) {
    console.error("Error formatting currency:", amount, e);
    return ""; // Return empty string on formatting error
  }
};

// You can add formatters for other currencies here later if needed
