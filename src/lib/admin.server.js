import { useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { ADMIN_SESSION_CONFIG } from "./admin-session";
export function passwordMatches(input, expected) {
    const a = createHash("sha256").update(input, "utf8").digest();
    const b = createHash("sha256").update(expected, "utf8").digest();
    return timingSafeEqual(a, b);
}
export async function getAdminSession() {
    return useSession(ADMIN_SESSION_CONFIG);
}
export async function requireAdmin(minRole) {
    const session = await getAdminSession();
    if (!session.data.unlocked) {
        throw new Error("UNAUTHORIZED");
    }
    if (minRole) {
        const order = { vendedor: 1, gerente: 2, dono: 3 };
        const need = order[minRole];
        const have = order[session.data.role ?? "vendedor"];
        if (have < need)
            throw new Error("FORBIDDEN");
    }
    return session;
}
export async function currentAdmin() {
    const session = await getAdminSession();
    if (!session.data.unlocked)
        return null;
    return {
        nome: session.data.nome ?? "Admin",
        role: session.data.role ?? "dono",
        login: session.data.login ?? "",
    };
}
