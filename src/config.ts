export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080";

export const WS_URL =
  import.meta.env.VITE_WS_URL || "ws://localhost:8080/ws";

export function apiUrl(path: string) {
  const base = API_BASE_URL.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}