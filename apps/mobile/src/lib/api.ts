import { getAuth } from "@react-native-firebase/auth";

const API_URL = process.env.EXPO_PUBLIC_API_URL; 

export async function apiGet<T>(path: string): Promise<T> {
  const user = getAuth().currentUser;
  if (!user) throw new Error("Not signed in");

  const token = await user.getIdToken();

  const res = await fetch(`${API_URL}${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}
