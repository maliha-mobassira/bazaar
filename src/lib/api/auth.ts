import { apiRequest } from "./client";

export interface LoginResponse {
  token: string;
}

export async function loginUser(email: string, password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>("/api/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}
