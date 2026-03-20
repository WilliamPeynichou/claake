import { Inject, Injectable, Logger } from "@nestjs/common";
import {
	EMAIL_SERVICE,
	type EmailServicePort,
} from "../domain/email-service.port.js";
import { agentApprovedTemplate } from "./templates/agent-approved.template.js";
import { agentRejectedTemplate } from "./templates/agent-rejected.template.js";
import { paymentConfirmedTemplate } from "./templates/payment-confirmed.template.js";
import { reviewReceivedTemplate } from "./templates/review-received.template.js";

export type NotificationEvent =
	| { type: "agent.approved"; to: string; agentName: string }
	| { type: "agent.rejected"; to: string; agentName: string; reason?: string }
	| {
			type: "payment.confirmed";
			to: string;
			agentName: string;
			amount: number;
			currency: string;
	  }
	| {
			type: "review.received";
			to: string;
			agentName: string;
			rating: number;
			reviewerName: string;
	  };

@Injectable()
export class NotificationService {
	private readonly logger = new Logger(NotificationService.name);

	constructor(@Inject(EMAIL_SERVICE) private readonly email: EmailServicePort) {}

	async notify(event: NotificationEvent): Promise<void> {
		try {
			switch (event.type) {
				case "agent.approved":
					await this.email.sendEmail({
						to: event.to,
						subject: `Votre agent "${event.agentName}" a \u00e9t\u00e9 approuv\u00e9`,
						html: agentApprovedTemplate(event.agentName),
					});
					break;
				case "agent.rejected":
					await this.email.sendEmail({
						to: event.to,
						subject: `Votre agent "${event.agentName}" n'a pas \u00e9t\u00e9 approuv\u00e9`,
						html: agentRejectedTemplate(event.agentName, event.reason),
					});
					break;
				case "payment.confirmed":
					await this.email.sendEmail({
						to: event.to,
						subject: `Achat confirm\u00e9 : ${event.agentName}`,
						html: paymentConfirmedTemplate(
							event.agentName,
							event.amount,
							event.currency,
						),
					});
					break;
				case "review.received":
					await this.email.sendEmail({
						to: event.to,
						subject: `Nouvel avis sur "${event.agentName}"`,
						html: reviewReceivedTemplate(
							event.agentName,
							event.rating,
							event.reviewerName,
						),
					});
					break;
			}
		} catch (err) {
			this.logger.error(`Failed to send notification: ${event.type}`, err);
		}
	}
}
