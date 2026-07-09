import {
	type ArgumentsHost,
	Catch,
	type ExceptionFilter,
	HttpException,
	HttpStatus,
	Logger,
} from "@nestjs/common";
import type { Response } from "express";
import { redactSensitive } from "../security/redact-sensitive.js";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
	private readonly logger = new Logger(AllExceptionsFilter.name);

	catch(exception: unknown, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const request = ctx.getRequest<{ method?: string; url?: string }>();

		let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
		let message = "Internal server error";
		let code = "INTERNAL_ERROR";

		if (exception instanceof HttpException) {
			statusCode = exception.getStatus();
			const exceptionResponse = exception.getResponse();
			message =
				typeof exceptionResponse === "string"
					? exceptionResponse
					: ((exceptionResponse as { message?: string }).message ?? exception.message);
			code = this.statusToCode(statusCode);
		}

		if (statusCode >= 500) {
			const errorText =
				exception instanceof Error ? `${exception.name}: ${exception.message}` : exception;
			this.logger.error(
				`Unhandled exception method=${request.method ?? "unknown"} url=${request.url ?? "unknown"} error=${redactSensitive(errorText)}`,
			);
		}

		response.status(statusCode).json({
			error: { code, message, statusCode },
		});
	}

	private statusToCode(status: number): string {
		const map: Record<number, string> = {
			400: "BAD_REQUEST",
			401: "UNAUTHORIZED",
			403: "FORBIDDEN",
			404: "NOT_FOUND",
			409: "CONFLICT",
			422: "UNPROCESSABLE_ENTITY",
			429: "TOO_MANY_REQUESTS",
		};
		return map[status] ?? "INTERNAL_ERROR";
	}
}
