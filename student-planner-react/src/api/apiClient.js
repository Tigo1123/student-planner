const configuredApiUrl = import.meta.env.VITE_API_URL;

if (!configuredApiUrl) {
  throw new Error("VITE_API_URL must be configured before Student Planner can start.");
}

const API_URL = configuredApiUrl.replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message, code = "REQUEST_FAILED", details = []) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.details = details;
  }
}

export async function apiRequest(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError("Unable to reach the Student Planner server.", "NETWORK_ERROR");
  }

  const payload = response.status === 204
    ? null
    : await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      payload?.error?.message || "The request could not be completed.",
      payload?.error?.code,
      payload?.error?.details,
    );
  }

  return payload;
}
