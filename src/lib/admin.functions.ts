import { createServerFn } from "@tanstack/react-start";

export const isAdmin = createServerFn({ method: "GET" }).handler(async () => {
  const { getAdminSession } = await import("./admin.server");
  const session = await getAdminSession();
  return {
    unlocked: !!session.data.unlocked,
    nome: session.data.nome ?? null,
    role: session.data.role ?? null,
    login: session.data.login ?? null,
  };
});

export const loginAdmin = createServerFn({ method: "POST" })
  .validator((data: { login?: string; password: string }) => data)
  .handler(async ({ data }) => {
    const { getAdminSession, passwordMatches } = await import("./admin.server");
    const { verifyFuncionarioCredentials } = await import("./users.server");
    const { appendLog } = await import("./logs.server");

    const loginId = (data.login ?? "").trim();

    // Fallback do dono via ADMIN_PASSWORD (mantido enquanto migra).
    if (!loginId || loginId.toLowerCase() === "dono" || loginId.toLowerCase() === "admin") {
      const expected = process.env.ADMIN_PASSWORD;
      if (expected && passwordMatches(data.password, expected)) {
        const session = await getAdminSession();
        await session.update({
          unlocked: true,
          nome: "Dono",
          login: "dono",
          role: "dono",
        });
        appendLog({ usuario: "dono", role: "dono", acao: "login", entidade: "sessao" });
        return { ok: true as const, nome: "Dono", role: "dono" as const };
      }
    }

    if (loginId) {
      try {
        const f = await verifyFuncionarioCredentials(loginId, data.password);
        if (f) {
          const session = await getAdminSession();
          await session.update({
            unlocked: true,
            userId: f.id,
            nome: f.nome,
            login: f.login,
            role: f.role,
          });
          appendLog({ usuario: f.login, role: f.role, acao: "login", entidade: "sessao" });
          return { ok: true as const, nome: f.nome, role: f.role };
        }
      } catch (err) {
        console.error("verifyFuncionarioCredentials error:", err);
      }
    }

    return { ok: false as const };
  });

export const logoutAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const { getAdminSession } = await import("./admin.server");
  const { appendLog } = await import("./logs.server");
  const session = await getAdminSession();
  const usuario = session.data.login;
  const role = session.data.role;
  await session.clear();
  if (usuario) appendLog({ usuario, role, acao: "logout", entidade: "sessao" });
  return { ok: true as const };
});
