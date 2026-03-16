export const EMAIL_SERVICE = Symbol("EMAIL_SERVICE");

export interface EmailServicePort {
	sendEmail(params: { to: string; subject: string; html: string }): Promise<void>;
}
