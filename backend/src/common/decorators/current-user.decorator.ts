import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { CurrentUserType } from "../types/current-user.type.js";

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
	const request = ctx.switchToHttp().getRequest();
	return request.user as CurrentUserType;
});
