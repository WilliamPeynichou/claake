import type { UserRole } from "@prisma/client";
import type { Request } from "express";

export interface AuthenticatedUser {
	id: string;
	email: string;
	role: UserRole;
}

export interface AuthenticatedRequest extends Request {
	user: AuthenticatedUser;
}
