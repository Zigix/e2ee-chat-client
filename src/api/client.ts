import type { ApiErrorResponse } from "../types/auth";
import { ApiHttpError } from "./normalizeError";
import { apiUrl } from "../config";

async function readErrorBody(
  res: Response,
): Promise<ApiErrorResponse | undefined> {
  const contentTypeHeader = res.headers.get("content-type") || "";

  try {
    if (contentTypeHeader.includes("application/json")) {
      return (await res.json()) as ApiErrorResponse;
    }
    const txt = await res.text();
    return txt ? { message: txt } : undefined;
  } catch {
    return undefined;
  }
}

export async function postJson<T>(path: string, payload: unknown): Promise<T> {
  const accessToken = getAccessToken();

  const headers = new Headers();

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  headers.set("Content-Type", "application/json");

  const apiResponse = await fetch(apiUrl(path), {
    method: "POST",
    headers: headers,
    body: JSON.stringify(payload),
  });

  if (!apiResponse.ok) {
    const body = await readErrorBody(apiResponse);
    throw new ApiHttpError(apiResponse.status, body);
  }

  const contentTypeHeader = apiResponse.headers.get("content-type") || "";
  if (!contentTypeHeader.includes("application/json")) return undefined as T;

  return (await apiResponse.json()) as T;
}

function getAccessToken(): string | null {
  return localStorage.getItem("accessToken");
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const accessToken = getAccessToken();

  const headers = new Headers(init.headers);

  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  const hasBody = init.body !== undefined && init.body !== null;
  if (hasBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const apiResponse = await fetch(apiUrl(`/api/${path}`), {
    ...init,
    headers,
  });

  const text = await apiResponse.text();
  const body = text ? safeJson(text) : null;

  if (!apiResponse.ok) {
    const message =
      body?.message ||
      body?.error ||
      `HTTP ${apiResponse.status} ${apiResponse.statusText}`;
    const err = new Error(message) as Error & {
      status?: number;
      body?: unknown;
    };
    err.status = apiResponse.status;
    err.body = body;
    throw err;
  }

  return body as T;
}

export async function apiDelete<T>(path: string, payload: unknown) {
  const accessToken = getAccessToken();

  const headers = new Headers();

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  headers.set("Content-Type", "application/json");

  const res = await fetch(apiUrl(path), {
    method: "DELETE",
    headers: headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await readErrorBody(res);
    throw new ApiHttpError(res.status, body);
  }

  const contetntTypeHeader = res.headers.get("content-type") || "";
  if (!contetntTypeHeader.includes("application/json")) return undefined as T;

  return (await res.json()) as T;
}

function safeJson(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
