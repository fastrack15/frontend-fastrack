const normalizeRole = (role) =>
  String(role ?? "")
    .trim()
    .toLowerCase();

export const isSuperadmin = (role) => normalizeRole(role) === "superadmin";

export const isAdmin = (role) => normalizeRole(role) === "admin";

export const isUser = (role) => normalizeRole(role) === "user";

export const canManageDefect = (role) =>
  ["superadmin", "admin"].includes(normalizeRole(role));

export const canViewAllRuas = (role) => isSuperadmin(role);
