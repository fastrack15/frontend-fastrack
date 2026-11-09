export const isSuperadmin = (role) => role === "superadmin";

export const isAdmin = (role) => role === "admin";

export const isUser = (role) => role === "user";

export const canManageDefect = (role) => ["superadmin", "admin"].includes(role);

export const canViewAllRuas = (role) => role === "superadmin";
