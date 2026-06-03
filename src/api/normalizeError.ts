import type { ApiErrorResponse } from "../types/auth";

export class ApiHttpError extends Error {
  status: number;
  body?: ApiErrorResponse;
  constructor(
    status: number,
    body?: ApiErrorResponse,
    fallback = `HTTP ${status}`,
  ) {
    super(body?.message || fallback);
    this.status = status;
    this.body = body;
  }
}
