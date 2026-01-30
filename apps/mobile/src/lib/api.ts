import { getAuth, getIdToken } from "@react-native-firebase/auth";

const API_URL = process.env.EXPO_PUBLIC_API_URL!;

async function apiRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
  const auth = getAuth();
  const user = auth.currentUser;
  const token = user ? await getIdToken(user) : null;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }

  // DELETE may return empty; backend returns JSON ok:true anyway
  return (await res.json()) as T;
}

export const apiGet = <T,>(path: string) => apiRequest<T>("GET", path);
export const apiPost = <T,>(path: string, body: unknown) => apiRequest<T>("POST", path, body);
export const apiPut = <T,>(path: string, body: unknown) => apiRequest<T>("PUT", path, body);
export const apiPatch = <T,>(path: string, body: unknown) => apiRequest<T>("PATCH", path, body);
export const apiDelete = <T,>(path: string) => apiRequest<T>("DELETE", path);
