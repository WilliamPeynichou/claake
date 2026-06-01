import {
	type CanActivate,
	type ExecutionContext,
	Injectable,
	UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { PrismaService } from "../../prisma/prisma.service.js";

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
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

		if (!authHeader?.startsWith("Bearer ")) {
			throw new UnauthorizedException("Missing or invalid authorization header");
		}

		const token = authHeader.slice(7);

		const {
			data: { user },
			error,
		} = await this.supabase.auth.getUser(token);

		if (error || !user) {
			throw new UnauthorizedException("Invalid or expired token");
		}

		// DB is the authorization source of truth. New local users are always
		// provisioned as USER; admin elevation must go through controlled backend flows.
		// Ensure the authenticated Supabase user exists locally without overwriting DB-managed roles.
		const dbUser = await this.prisma.user.upsert({
			where: { id: user.id },
			create: {
				id: user.id,
				email: user.email ?? "",
				role: "USER",
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
