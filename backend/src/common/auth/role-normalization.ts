import type { UserRole } from "@prisma/client";

const VALID_ROLES = new Set<UserRole>(["USER", "CREATOR", "ADMIN", "SUPER_ADMIN"]);

export function normalizeUserRole(role: unknown): UserRole | null {
	if (typeof role !== "string") return null;
	const normalized = role.toUpperCase() === "DEVELOPER" ? "CREATOR" : role.toUpperCase();
	return VALID_ROLES.has(normalized as UserRole) ? (normalized as UserRole) : null;
}
