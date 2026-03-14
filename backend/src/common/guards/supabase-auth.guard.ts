import {
	type CanActivate,
	type ExecutionContext,
	Injectable,
	UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { UserRole } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { PrismaService } from "../../prisma/prisma.service.js";
import type { CurrentUserType } from "../types/current-user.type.js";

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
	constructor(
		private readonly config: ConfigService,
		private readonly prisma: PrismaService,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const authHeader = request.headers.authorization;

		if (!authHeader?.startsWith("Bearer ")) {
			throw new UnauthorizedException("Missing or invalid authorization header");
		}

		const token = authHeader.slice(7);

		const supabase = createClient(
			this.config.getOrThrow<string>("SUPABASE_URL"),
			this.config.getOrThrow<string>("SUPABASE_SERVICE_ROLE_KEY"),
		);

		const {
			data: { user },
			error,
		} = await supabase.auth.getUser(token);

		if (error || !user?.email) {
			throw new UnauthorizedException("Invalid or expired token");
		}

		const syncedUser = await this.syncSupabaseUser(user.id, user.email, user.user_metadata ?? {});

		request.user = {
			id: syncedUser.id,
			email: syncedUser.email,
			role: syncedUser.role,
			displayName: syncedUser.displayName,
			avatarUrl: syncedUser.avatarUrl,
		} satisfies CurrentUserType;

		return true;
	}

	private async syncSupabaseUser(
		id: string,
		email: string,
		metadata: Record<string, unknown>,
	) {
		const existingUser = await this.prisma.user.findUnique({
			where: { id },
			select: {
				id: true,
				email: true,
				role: true,
				displayName: true,
				avatarUrl: true,
			},
		});

		if (!existingUser) {
			return this.prisma.user.create({
				data: {
					id,
					email,
					role: this.mapSupabaseRole(metadata.role),
					displayName: this.getDisplayName(metadata),
					avatarUrl: this.getAvatarUrl(metadata),
				},
				select: {
					id: true,
					email: true,
					role: true,
					displayName: true,
					avatarUrl: true,
				},
			});
		}

		const nextDisplayName = existingUser.displayName ?? this.getDisplayName(metadata);
		const nextAvatarUrl = existingUser.avatarUrl ?? this.getAvatarUrl(metadata);
		const shouldUpdate =
			existingUser.email !== email ||
			existingUser.displayName !== nextDisplayName ||
			existingUser.avatarUrl !== nextAvatarUrl;

		if (!shouldUpdate) {
			return existingUser;
		}

		return this.prisma.user.update({
			where: { id },
			data: {
				email,
				displayName: nextDisplayName,
				avatarUrl: nextAvatarUrl,
			},
			select: {
				id: true,
				email: true,
				role: true,
				displayName: true,
				avatarUrl: true,
			},
		});
	}

	private mapSupabaseRole(role: unknown): UserRole {
		if (typeof role !== "string") {
			return UserRole.USER;
		}

		switch (role.toLowerCase()) {
			case "admin":
				return UserRole.ADMIN;
			case "creator":
			case "developer":
				return UserRole.CREATOR;
			default:
				return UserRole.USER;
		}
	}

	private getDisplayName(metadata: Record<string, unknown>): string | null {
		return (
			this.pickString(metadata.display_name) ??
			this.pickString(metadata.full_name) ??
			this.pickString(metadata.name)
		);
	}

	private getAvatarUrl(metadata: Record<string, unknown>): string | null {
		return this.pickString(metadata.avatar_url) ?? this.pickString(metadata.picture);
	}

	private pickString(value: unknown): string | null {
		return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
	}
}
