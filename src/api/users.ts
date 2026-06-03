import { apiFetch } from "./client";

export type SearchUserResponse = {
  id: number;
  username: string;
};

export async function searchUsers(q: string, signal?: AbortSignal): Promise<SearchUserResponse[]> {
  const query = new URLSearchParams({ q }).toString();

  return apiFetch<SearchUserResponse[]>(`/users/search?${query}`, {
    method: "GET",
    signal,
  });
}

export async function getUserPublicEcdhJwk(userId: number) {
  return apiFetch<string>(`/users/${userId}/public-key`);
}
