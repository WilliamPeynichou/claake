import {
	type CallHandler,
	type ExecutionContext,
	Injectable,
	type NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { map, type Observable } from "rxjs";
import { SKIP_TRANSFORM_KEY } from "../decorators/skip-transform.decorator.js";

@Injectable()
export class ResponseTransformInterceptor implements NestInterceptor {
	constructor(private readonly reflector: Reflector) {}

	intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		const skip = this.reflector.getAllAndOverride<boolean>(SKIP_TRANSFORM_KEY, [
			context.getHandler(),
			context.getClass(),
		]);

		if (skip) {
			return next.handle();
		}

		return next.handle().pipe(
			map((data) => {
				if (data && typeof data === "object" && "error" in data) {
					return data;
				}
				if (data && typeof data === "object" && "data" in data) {
					return data;
				}
				return { data };
			}),
		);
	}
}
