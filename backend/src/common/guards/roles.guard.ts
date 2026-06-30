import {
	type CanActivate,
	type ExecutionContext,
	ForbiddenException,
	Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../decorators/roles.decorator.js";

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private readonly reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
			context.getHandler(),
			context.getClass(),
		]);

		if (!requiredRoles?.length) {
			return true;
		}

		const { user } = context.switchToHttp().getRequest();

		if (!user?.role) {
			throw new ForbiddenException("Access denied");
		}

		// SUPER_ADMIN has all ADMIN access
		if (user.role === "SUPER_ADMIN" && requiredRoles.includes("ADMIN")) {
			return true;
		}

		if (!requiredRoles.includes(user.role)) {
			throw new ForbiddenException("Access denied");
		}

		return true;
	}
}
