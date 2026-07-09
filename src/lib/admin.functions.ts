import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { ADMIN_SESSION_CONFIG, type AdminSession } from "./admin-session";

function passwordMatches(input: string, expected: string): boolean {
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

export async function requireAdmin() {
  const session = await useSession<AdminSession>(ADMIN_SESSION_CONFIG);
  if (!session.data.unlocked) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export const isAdmin = createServerFn({ method: "GET" }).handler(async () => {
  const session = await useSession<AdminSession>(ADMIN_SESSION_CONFIG);
  return { unlocked: !!session.data.unlocked };
});

export const loginAdmin = createServerFn({ method: "POST" })
  .inputValidator((data: { password: string }) => data)
  .handler(async ({ data }) => {
    const expected = process.env.ADMIN_PASSWORD;
    if (!expected) throw new Error("ADMIN_PASSWORD não configurado");
    if (!passwordMatches(data.password, expected)) {
      return { ok: false as const };
    }
    const session = await useSession<AdminSession>(ADMIN_SESSION_CONFIG);
    await session.update({ unlocked: true });
    return { ok: true as const };
  });

export const logoutAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const session = await useSession<AdminSession>(ADMIN_SESSION_CONFIG);
  await session.clear();
  return { ok: true as const };
});
