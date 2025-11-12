import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSalary(
  minSalary?: number | null,
  maxSalary?: number | null
): string {
  if (
    minSalary === undefined ||
    maxSalary === undefined ||
    minSalary === null ||
    maxSalary === null
  ) {
    return "Salary not specified";
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (minSalary === maxSalary) {
    return formatCurrency(minSalary);
  }

  return `${formatCurrency(minSalary)} - ${formatCurrency(maxSalary)}`;
}

export function formatDate(dateString?: string): string {
  if (!dateString) return "Date not specified";

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid date";

    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch (error) {
    return "Invalid date";
  }
}

export function formatDateTime(dateString?: string): string {
  if (!dateString) return "Date not specified";

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid date";

    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch (error) {
    return "Invalid date";
  }
}

// Input formatting functions for real-time currency input
export function formatCurrencyInput(value: string): string {
  // Remove non-numeric characters
  const numericValue = value.replace(/[^\d]/g, "");

  if (numericValue === "") return "";

  // Format with thousand separators
  return parseInt(numericValue).toLocaleString("id-ID");
}

export function parseCurrencyInput(formattedValue: string): string {
  // Remove formatting to get numeric value for storage
  return formattedValue.replace(/[^\d]/g, "");
}

export function formatCurrencyDisplay(numericValue: string | number): string {
  const num =
    typeof numericValue === "string" ? parseInt(numericValue) : numericValue;

  if (isNaN(num) || num === 0) return "Rp 0";

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

// Simple stable ID generator to prevent hydration mismatches
// Creates deterministic IDs based on a simple index
function createFormIdGenerator() {
  let counter = 0;
  return () => {
    counter++;
    return `form-${counter}`;
  };
}

// Export a singleton instance for consistent IDs across the app
export const generateFormId = createFormIdGenerator();
