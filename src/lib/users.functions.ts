import { createServerFn } from "@tanstack/react-start";

export const listarFuncionarios = createServerFn({ method: "GET" }).handler(async () => {
  const { requireAdmin } = await import("./admin.server");
  await requireAdmin("dono");
  const { listFuncionarios } = await import("./users.server");
  return listFuncionarios();
});

export const criarFuncionario = createServerFn({ method: "POST" })
  .validator(
    (data: {
      nome: string;
      login: string;
      password: string;
      role: "dono" | "gerente" | "vendedor";
      ativo?: boolean;
    }) => data,
  )
  .handler(async ({ data }) => {
    const { requireAdmin, currentAdmin } = await import("./admin.server");
    await requireAdmin("dono");
    const { createFuncionario } = await import("./users.server");
    const { appendLog } = await import("./logs.server");
    const me = await currentAdmin();
    const f = await createFuncionario(data);
    appendLog({
      usuario: me?.login,
      role: me?.role,
      acao: "criar",
      entidade: "funcionario",
      id: f.id,
      depois: `${f.nome} (${f.login}) — ${f.role}`,
    });
    return f;
  });

export const atualizarFuncionario = createServerFn({ method: "POST" })
  .validator(
    (data: {
      id: string;
      nome?: string;
      login?: string;
      password?: string;
      role?: "dono" | "gerente" | "vendedor";
      ativo?: boolean;
    }) => data,
  )
  .handler(async ({ data }) => {
    const { requireAdmin, currentAdmin } = await import("./admin.server");
    await requireAdmin("dono");
    const { updateFuncionario } = await import("./users.server");
    const { appendLog } = await import("./logs.server");
    const me = await currentAdmin();
    await updateFuncionario(data);
    const changes = Object.entries(data)
      .filter(([k, v]) => k !== "id" && v !== undefined)
      .map(([k]) => (k === "password" ? "senha" : k))
      .join(", ");
    appendLog({
      usuario: me?.login,
      role: me?.role,
      acao: "atualizar",
      entidade: "funcionario",
      id: data.id,
      depois: changes,
    });
    return { ok: true };
  });

export const removerFuncionario = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const { requireAdmin, currentAdmin } = await import("./admin.server");
    await requireAdmin("dono");
    const { deleteFuncionario } = await import("./users.server");
    const { appendLog } = await import("./logs.server");
    const me = await currentAdmin();
    await deleteFuncionario(data.id);
    appendLog({
      usuario: me?.login,
      role: me?.role,
      acao: "remover",
      entidade: "funcionario",
      id: data.id,
    });
    return { ok: true };
  });
