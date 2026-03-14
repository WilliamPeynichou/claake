import {
	type CallHandler,
	type ExecutionContext,
	Injectable,
	Logger,
	type NestInterceptor,
} from "@nestjs/common";
import { type Observable, tap } from "rxjs";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
	private readonly logger = new Logger("HTTP");

	intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		const request = context.switchToHttp().getRequest();
		const { method, url } = request;
		const start = Date.now();

		return next.handle().pipe(
			tap(() => {
				const response = context.switchToHttp().getResponse();
				const duration = Date.now() - start;
				this.logger.log(`${method} ${url} ${response.statusCode} — ${duration}ms`);
			}),
		);
	}
}
