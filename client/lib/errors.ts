/**
 * Client-side Error Mapping System
 * Decouples raw backend error messages and database details from UI toast messages.
 * This prevents information disclosure and prepares the app for potential localization.
 */

export type ErrorKey =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "MONITOR_LIMIT_REACHED"
  | "STATUS_PAGE_LIMIT_REACHED"
  | "FREQUENCY_LIMIT_EXCEEDED"
  | "REGIONS_LIMIT_EXCEEDED"
  | "MONITOR_NOT_FOUND"
  | "STATUS_PAGE_NOT_FOUND"
  | "INCIDENT_NOT_FOUND"
  | "INVALID_API_KEY"
  | "API_KEY_REQUIRED"
  | "UPDATE_MESSAGE_REQUIRED"
  | "INTERNAL_SERVER_ERROR"
  | "UNKNOWN_ERROR";

export const ERROR_MESSAGES: Record<ErrorKey, string> = {
  UNAUTHORIZED: "You must be logged in to perform this action. Please log in again.",
  FORBIDDEN: "Access denied. You do not have the required permissions.",
  MONITOR_LIMIT_REACHED: "You have reached the maximum number of monitors allowed for your subscription plan. Please upgrade to create more.",
  STATUS_PAGE_LIMIT_REACHED: "You have reached the maximum number of status pages allowed for your subscription plan. Please upgrade to create more.",
  FREQUENCY_LIMIT_EXCEEDED: "The selected check frequency is faster than your current plan allows. Please select a longer interval or upgrade.",
  REGIONS_LIMIT_EXCEEDED: "You have selected more monitoring regions than your current plan allows. Please select fewer regions or upgrade.",
  MONITOR_NOT_FOUND: "The requested monitor could not be found or has been deleted.",
  STATUS_PAGE_NOT_FOUND: "The requested status page could not be found or has been deleted.",
  INCIDENT_NOT_FOUND: "The requested incident could not be found.",
  INVALID_API_KEY: "The provided API key is invalid or has expired.",
  API_KEY_REQUIRED: "An API key is required to access this resource.",
  UPDATE_MESSAGE_REQUIRED: "Please provide an update message.",
  INTERNAL_SERVER_ERROR: "An unexpected error occurred on our servers. Our team has been notified. Please try again later.",
  UNKNOWN_ERROR: "An unexpected error occurred. Please check your connection and try again.",
};

/**
 * Maps a raw backend error message and HTTP status code to a user-friendly ErrorKey
 */
export function getErrorKey(rawMessage: string | null | undefined, statusCode?: number): ErrorKey {
  const msg = (rawMessage || "").toLowerCase();

  // 1. Check message content first for specific errors
  if (msg.includes("limit") && msg.includes("monitor")) {
    return "MONITOR_LIMIT_REACHED";
  }
  if (msg.includes("limit") && msg.includes("status page")) {
    return "STATUS_PAGE_LIMIT_REACHED";
  }
  if (msg.includes("frequency")) {
    return "FREQUENCY_LIMIT_EXCEEDED";
  }
  if (msg.includes("regions")) {
    return "REGIONS_LIMIT_EXCEEDED";
  }
  if (msg.includes("invalid api key")) {
    return "INVALID_API_KEY";
  }
  if (msg.includes("api key required")) {
    return "API_KEY_REQUIRED";
  }
  if (msg.includes("update message is required")) {
    return "UPDATE_MESSAGE_REQUIRED";
  }
  if (msg.includes("not found")) {
    if (msg.includes("monitor")) return "MONITOR_NOT_FOUND";
    if (msg.includes("status page")) return "STATUS_PAGE_NOT_FOUND";
    if (msg.includes("incident")) return "INCIDENT_NOT_FOUND";
  }

  // 2. Check HTTP status codes for generic categorization
  if (statusCode === 401) {
    return "UNAUTHORIZED";
  }
  if (statusCode === 403) {
    return "FORBIDDEN";
  }
  if (statusCode === 404) {
    return "UNKNOWN_ERROR"; // Could be arbitrary endpoint not found, fall back
  }
  if (statusCode && statusCode >= 500) {
    return "INTERNAL_SERVER_ERROR";
  }

  // 3. Last fallback check of common phrases
  if (msg.includes("unauthorized") || msg.includes("access denied. no token")) {
    return "UNAUTHORIZED";
  }
  if (msg.includes("access denied") || msg.includes("permission")) {
    return "FORBIDDEN";
  }

  return "UNKNOWN_ERROR";
}

/**
 * Returns a secure, friendly message for toast notifications.
 * Log the raw error message to the console for developers.
 */
export function getFriendlyErrorMessage(
  error: any,
  fallbackMessage: string = ERROR_MESSAGES.UNKNOWN_ERROR
): string {
  // Extract details
  let rawMessage = "";
  let statusCode: number | undefined = undefined;

  if (typeof error === "string") {
    rawMessage = error;
  } else if (error && typeof error === "object") {
    rawMessage = error.message || error.error || "";
    statusCode = error.status || error.statusCode;
  }

  // Log raw error for debugging (won't be exposed in UI toast)
  console.error("[Backend Error Debug Info]:", { rawMessage, statusCode, originalError: error });

  const key = getErrorKey(rawMessage, statusCode);
  if (key === "UNKNOWN_ERROR" && fallbackMessage !== ERROR_MESSAGES.UNKNOWN_ERROR) {
    return fallbackMessage;
  }

  return ERROR_MESSAGES[key];
}
