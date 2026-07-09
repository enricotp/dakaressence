import { useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { ADMIN_SESSION_CONFIG, type AdminSession } from "./admin-session";

export function passwordMatches(input: string, expected: string): boolean {
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

export async function getAdminSession() {
  return useSession<AdminSession>(ADMIN_SESSION_CONFIG);
}

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session.data.unlocked) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}
