import type { UserRole } from "../services/userService";

export type Permission =
  | "inventory:create"
  | "inventory:update"
  | "inventory:delete"
  | "stock:move"
  | "categories:manage"
  | "suppliers:manage"
  | "users:manage"
  | "settings:manage"
  | "audit:view"
  | "reports:view"
  | "alerts:view"
  | "qr:view";

export type AppRole = UserRole;

const adminPermissions: Permission[] = [
  "inventory:create",
  "inventory:update",
  "inventory:delete",
  "stock:move",
  "categories:manage",
  "suppliers:manage",
  "users:manage",
  "settings:manage",
  "audit:view",
  "reports:view",
  "alerts:view",
  "qr:view",
];

export const rolePermissions: Record<AppRole, Permission[]> = {
  Admin: adminPermissions,
  Staff: [
    "inventory:create",
    "inventory:update",
    "stock:move",
    "categories:manage",
    "suppliers:manage",
    "audit:view",
    "reports:view",
    "alerts:view",
    "qr:view",
  ],
  Viewer: ["audit:view", "reports:view", "alerts:view", "qr:view"],
};

export const normalizeRole = (role?: string | null): AppRole => {
  if (role === "Admin" || role === "Staff" || role === "Viewer") {
    return role;
  }

  return "Viewer";
};

export const hasPermission = (
  role: string | null | undefined,
  permission: Permission
) => rolePermissions[normalizeRole(role)].includes(permission);
