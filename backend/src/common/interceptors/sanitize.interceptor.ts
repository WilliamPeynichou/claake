import {
	type CallHandler,
	type ExecutionContext,
	Injectable,
	type NestInterceptor,
} from "@nestjs/common";
import type { Observable } from "rxjs";
import sanitizeHtml from "sanitize-html";

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
	allowedTags: [],
	allowedAttributes: {},
};

function sanitizeValue(value: unknown): unknown {
	if (typeof value === "string") {
		return sanitizeHtml(value, SANITIZE_OPTIONS);
	}
	if (Array.isArray(value)) {
		return value.map(sanitizeValue);
	}
	if (value && typeof value === "object") {
		const result: Record<string, unknown> = {};
		for (const [key, val] of Object.entries(value)) {
			result[key] = sanitizeValue(val);
		}
		return result;
	}
	return value;
}

@Injectable()
export class SanitizeInterceptor implements NestInterceptor {
	intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		const request = context.switchToHttp().getRequest();
		if (request.body && typeof request.body === "object") {
			request.body = sanitizeValue(request.body);
		}
		return next.handle();
	}
}
