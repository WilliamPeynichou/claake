import { Injectable, Logger } from "@nestjs/common";
import type { EmailServicePort } from "../domain/email-service.port.js";

/**
 * Development email service that logs emails to console.
 * Replace with a real SMTP/Supabase implementation for production.
 */
@Injectable()
export class ConsoleEmailService implements EmailServicePort {
	private readonly logger = new Logger(ConsoleEmailService.name);

	async sendEmail(params: { to: string; subject: string; html: string }): Promise<void> {
		this.logger.log(`[EMAIL] To: ${params.to} | Subject: ${params.subject}`);
		this.logger.debug(`[EMAIL BODY] ${params.html.slice(0, 200)}...`);
	}
}
