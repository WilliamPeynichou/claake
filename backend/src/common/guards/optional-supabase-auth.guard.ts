import {
	type CanActivate,
	type ExecutionContext,
	Injectable,
	UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { PrismaService } from "../../prisma/prisma.service.js";
import { normalizeUserRole } from "../auth/role-normalization.js";

@Injectable()
export class OptionalSupabaseAuthGuard implements CanActivate {
	private readonly supabase: SupabaseClient;

	constructor(
		private readonly config: ConfigService,
		private readonly prisma: PrismaService,
	) {
		this.supabase = createClient(
			this.config.getOrThrow<string>("SUPABASE_URL"),
			this.config.getOrThrow<string>("SUPABASE_SERVICE_ROLE_KEY"),
		);
	}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const authHeader = request.headers.authorization;

		if (!authHeader) return true;

		if (!authHeader.startsWith("Bearer ")) {
			throw new UnauthorizedException("Invalid authorization header");
		}

		const token = authHeader.slice(7);
		const {
			data: { user },
			error,
		} = await this.supabase.auth.getUser(token);

		if (error || !user) {
			throw new UnauthorizedException("Invalid or expired token");
		}

		const cloudRole = normalizeUserRole(user.app_metadata?.role);
		const dbUser = await this.prisma.user.upsert({
			where: { id: user.id },
			create: {
				id: user.id,
				email: user.email ?? "",
				role: cloudRole ?? "USER",
			},
			update: {},
			select: { role: true },
		});

		request.user = {
			id: user.id,
			email: user.email ?? "",
			role: dbUser.role,
		};

		return true;
	}
}
