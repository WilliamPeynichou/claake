import {
	type ArgumentsHost,
	Catch,
	type ExceptionFilter,
	HttpException,
	HttpStatus,
	Logger,
} from "@nestjs/common";
import type { Response } from "express";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
	private readonly logger = new Logger(AllExceptionsFilter.name);

	catch(exception: unknown, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();

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
			this.logger.error(exception);
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
