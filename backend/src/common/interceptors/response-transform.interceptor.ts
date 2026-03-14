import {
	type CallHandler,
	type ExecutionContext,
	Injectable,
	type NestInterceptor,
} from "@nestjs/common";
import { map, type Observable } from "rxjs";

@Injectable()
export class ResponseTransformInterceptor implements NestInterceptor {
	intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
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
