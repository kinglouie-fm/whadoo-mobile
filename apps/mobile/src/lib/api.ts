import { getAuth, getIdToken } from "@react-native-firebase/auth";

const API_URL = process.env.EXPO_PUBLIC_API_URL; 

async function getToken(): Promise<string> {
  const user = getAuth().currentUser;
  if (!user) throw new Error("Not signed in");

  // forceRefresh=false is fine for MVP
  return getIdToken(user, false);
}

export async function apiGet<T>(path: string): Promise<T> {
  const token = await getToken();

  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

export async function apiPatch<T>(path: string, body: any): Promise<T> {
  const token = await getToken();

  const res = await fetch(`${API_URL}${path}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

