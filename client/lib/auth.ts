import { getMe } from "./api";
import type { User } from "@/types";

export async function getAuthUser(): Promise<User | null> {
  try {
    const res = await getMe();
    const data = res.data.user ?? res.data;
    // Normalize MongoDB _id to id
    return { ...data, id: (data._id ?? data.id)?.toString() } as User;
  } catch {
    return null;
  }
}
