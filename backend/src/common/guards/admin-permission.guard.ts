import {
	type CanActivate,
	type ExecutionContext,
	ForbiddenException,
	Injectable,
} from "@nestjs/common";
import type { Reflector } from "@nestjs/core";
import type { AdminPermissions } from "../../modules/users/domain/entities/user.entity.js";
import { PrismaService } from "../../prisma/prisma.service.js";
import { ADMIN_PERMISSION_KEY } from "../decorators/admin-permission.decorator.js";

@Injectable()
export class AdminPermissionGuard implements CanActivate {
	constructor(
		private readonly reflector: Reflector,
		private readonly prisma: PrismaService,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const requiredPermission = this.reflector.getAllAndOverride<keyof AdminPermissions>(
			ADMIN_PERMISSION_KEY,
			[context.getHandler(), context.getClass()],
		);

		if (!requiredPermission) {
			return true;
		}

		const { user } = context.switchToHttp().getRequest();

		if (!user?.role) {
			throw new ForbiddenException("Access denied");
		}

		// SUPER_ADMIN bypasses all permission checks
		if (user.role === "SUPER_ADMIN") {
			return true;
		}

		if (user.role !== "ADMIN") {
			throw new ForbiddenException("Access denied");
		}

		// Fetch admin permissions from DB
		const dbUser = await this.prisma.user.findUnique({
			where: { id: user.id },
			select: { adminPermissions: true },
		});

		const permissions = dbUser?.adminPermissions as AdminPermissions | null;

		if (!permissions?.[requiredPermission]) {
			throw new ForbiddenException("You do not have permission for this action");
		}

		return true;
	}
}
