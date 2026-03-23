import { api } from "@/lib/api-client";

export async function registerAPI(payload: { name?: string; email: string; password: string }) {
  const result = await api.register(payload.name || "User", payload.email, payload.password);
  if (result.error) throw new Error(result.error);
  return result.data;
}

export async function loginAPI(payload: { email: string; password: string }) {
  const result = await api.login(payload.email, payload.password);
  if (result.error) throw new Error(result.error);
  return result.data;
}

export async function logoutAPI() {
  const result = await api.logout();
  if (result.error) throw new Error(result.error);
  return result.data;
}

export async function meAPI() {
  const result = await api.getCurrentUser();
  if (result.error) throw new Error(result.error);
  return result.data;
}
