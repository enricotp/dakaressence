// Server-only helpers for Notion "Funcionários" database + password hashing.
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const FUNCIONARIOS_DB = "3a958811-29ca-8108-a1ce-c02e13f5ac30";
const GATEWAY = "https://connector-gateway.lovable.dev/notion/v1";

export type Role = "dono" | "gerente" | "vendedor";

export type Funcionario = {
  id: string;
  nome: string;
  login: string;
  role: Role;
  ativo: boolean;
  criadoEm: string;
  ultimoAcesso: string | null;
};

function notionHeaders() {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const notionKey = process.env.NOTION_API_KEY;
  if (!lovableKey || !notionKey) throw new Error("Notion connector não configurado");
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": notionKey,
    "Content-Type": "application/json",
  };
}

export function hashPassword(plain: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(plain, salt, 32);
  return `${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function verifyPassword(plain: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split("$");
  if (!saltHex || !hashHex) return false;
  try {
    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(hashHex, "hex");
    const actual = scryptSync(plain, salt, expected.length);
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

type NotionPage = {
  id: string;
  created_time: string;
  properties: Record<
    string,
    {
      type: string;
      title?: Array<{ plain_text: string }>;
      rich_text?: Array<{ plain_text: string }>;
      select?: { name?: string } | null;
      checkbox?: boolean;
      date?: { start: string } | null;
      created_time?: string;
    }
  >;
};

function mapPage(page: NotionPage): Funcionario {
  const nome = page.properties["Nome"]?.title?.[0]?.plain_text ?? "";
  const login = page.properties["Login"]?.rich_text?.map((t) => t.plain_text).join("") ?? "";
  const roleRaw = (page.properties["Role"]?.select?.name ?? "vendedor").toLowerCase();
  const role: Role =
    roleRaw === "dono" || roleRaw === "gerente" ? (roleRaw as Role) : "vendedor";
  const ativo = page.properties["Ativo"]?.checkbox ?? false;
  const ultimoAcesso = page.properties["UltimoAcesso"]?.date?.start ?? null;
  return {
    id: page.id,
    nome,
    login,
    role,
    ativo,
    criadoEm: page.properties["Criado em"]?.created_time ?? page.created_time,
    ultimoAcesso,
  };
}

export async function listFuncionarios(): Promise<Funcionario[]> {
  const res = await fetch(`${GATEWAY}/databases/${FUNCIONARIOS_DB}/query`, {
    method: "POST",
    headers: notionHeaders(),
    body: JSON.stringify({ page_size: 100 }),
  });
  if (!res.ok) throw new Error(`Notion funcionários query failed [${res.status}]`);
  const json = (await res.json()) as { results: NotionPage[] };
  return json.results.map(mapPage);
}

async function findFuncionarioPage(login: string): Promise<NotionPage | null> {
  const res = await fetch(`${GATEWAY}/databases/${FUNCIONARIOS_DB}/query`, {
    method: "POST",
    headers: notionHeaders(),
    body: JSON.stringify({
      page_size: 5,
      filter: { property: "Login", rich_text: { equals: login } },
    }),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { results: NotionPage[] };
  return json.results[0] ?? null;
}

export async function findFuncionarioByLogin(login: string): Promise<Funcionario | null> {
  const p = await findFuncionarioPage(login);
  return p ? mapPage(p) : null;
}

export async function verifyFuncionarioCredentials(
  login: string,
  password: string,
): Promise<Funcionario | null> {
  const page = await findFuncionarioPage(login);
  if (!page) return null;
  const stored = page.properties["SenhaHash"]?.rich_text?.map((t) => t.plain_text).join("") ?? "";
  if (!stored || !verifyPassword(password, stored)) return null;
  const f = mapPage(page);
  if (!f.ativo) return null;
  // Best-effort update UltimoAcesso
  fetch(`${GATEWAY}/pages/${f.id}`, {
    method: "PATCH",
    headers: notionHeaders(),
    body: JSON.stringify({
      properties: { UltimoAcesso: { date: { start: new Date().toISOString() } } },
    }),
  }).catch(() => {});
  return f;
}

export async function createFuncionario(input: {
  nome: string;
  login: string;
  password: string;
  role: Role;
  ativo?: boolean;
}): Promise<Funcionario> {
  const existing = await findFuncionarioPage(input.login);
  if (existing) throw new Error("Já existe um funcionário com esse login");
  const senhaHash = hashPassword(input.password);
  const res = await fetch(`${GATEWAY}/pages`, {
    method: "POST",
    headers: notionHeaders(),
    body: JSON.stringify({
      parent: { database_id: FUNCIONARIOS_DB },
      properties: {
        Nome: { title: [{ text: { content: input.nome } }] },
        Login: { rich_text: [{ text: { content: input.login } }] },
        SenhaHash: { rich_text: [{ text: { content: senhaHash } }] },
        Role: { select: { name: input.role } },
        Ativo: { checkbox: input.ativo ?? true },
      },
    }),
  });
  if (!res.ok) throw new Error(`Notion create funcionário failed [${res.status}]: ${await res.text()}`);
  const created = (await res.json()) as NotionPage;
  return mapPage(created);
}

export async function updateFuncionario(input: {
  id: string;
  nome?: string;
  login?: string;
  password?: string;
  role?: Role;
  ativo?: boolean;
}): Promise<void> {
  const properties: Record<string, unknown> = {};
  if (input.nome !== undefined) properties["Nome"] = { title: [{ text: { content: input.nome } }] };
  if (input.login !== undefined)
    properties["Login"] = { rich_text: [{ text: { content: input.login } }] };
  if (input.password) properties["SenhaHash"] = { rich_text: [{ text: { content: hashPassword(input.password) } }] };
  if (input.role !== undefined) properties["Role"] = { select: { name: input.role } };
  if (input.ativo !== undefined) properties["Ativo"] = { checkbox: input.ativo };
  const res = await fetch(`${GATEWAY}/pages/${input.id}`, {
    method: "PATCH",
    headers: notionHeaders(),
    body: JSON.stringify({ properties }),
  });
  if (!res.ok) throw new Error(`Notion update funcionário failed [${res.status}]`);
}

export async function deleteFuncionario(id: string): Promise<void> {
  const res = await fetch(`${GATEWAY}/pages/${id}`, {
    method: "PATCH",
    headers: notionHeaders(),
    body: JSON.stringify({ archived: true }),
  });
  if (!res.ok) throw new Error(`Notion delete funcionário failed [${res.status}]`);
}
