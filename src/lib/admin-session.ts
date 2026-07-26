// Server-only session config for admin gate. Read env inside handlers.
export const ADMIN_SESSION_CONFIG = {
  password: process.env.SESSION_SECRET ?? "dev-only-session-secret-change-me-please-32ch",
  name: "dakar-admin",
  maxAge: 60 * 60 * 24 * 7,
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    path: "/",
  },
};

export type AdminRole = "dono" | "gerente" | "vendedor";

export type AdminSession = {
  unlocked?: boolean;
  userId?: string;
  nome?: string;
  login?: string;
  role?: AdminRole;
};
