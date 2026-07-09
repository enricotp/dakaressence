import { createServerFn } from "@tanstack/react-start";

export const isAdmin = createServerFn({ method: "GET" }).handler(async () => {
  const { getAdminSession } = await import("./admin.server");
  const session = await getAdminSession();
  return { unlocked: !!session.data.unlocked };
});

export const loginAdmin = createServerFn({ method: "POST" })
  .validator((data: { password: string }) => data)
  .handler(async ({ data }) => {
    const { getAdminSession, passwordMatches } = await import("./admin.server");
    const expected = process.env.ADMIN_PASSWORD;
    if (!expected) throw new Error("ADMIN_PASSWORD não configurado");
    if (!passwordMatches(data.password, expected)) {
      return { ok: false as const };
    }
    const session = await getAdminSession();
    await session.update({ unlocked: true });
    return { ok: true as const };
  });

export const logoutAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const { getAdminSession } = await import("./admin.server");
  const session = await getAdminSession();
  await session.clear();
  return { ok: true as const };
});
