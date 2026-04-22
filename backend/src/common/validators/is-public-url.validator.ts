import type { ValidationArguments, ValidationOptions } from "class-validator";
import { registerDecorator } from "class-validator";

const BLOCKED_HOSTNAME_PATTERNS = [
	/^localhost$/i,
	/^127\./,
	/^0\.0\.0\.0$/,
	/^::1$/,
	/^0:0:0:0:0:0:0:1$/,
	/^169\.254\./,
	/^10\./,
	/^172\.(1[6-9]|2\d|3[01])\./,
	/^192\.168\./,
	/^fc00:/i,
	/^fe80:/i,
	/^100\.64\./,
];

export function IsPublicUrl(options?: ValidationOptions) {
	return function (object: object, propertyName: string) {
		registerDecorator({
			name: "isPublicUrl",
			target: object.constructor,
			propertyName,
			options,
			validator: {
				validate(value: unknown): boolean {
					if (typeof value !== "string") return false;
					let url: URL;
					try {
						url = new URL(value);
					} catch {
						return false;
					}
					if (!["http:", "https:"].includes(url.protocol)) return false;
					const hostname = url.hostname;
					return !BLOCKED_HOSTNAME_PATTERNS.some((p) => p.test(hostname));
				},
				defaultMessage(args: ValidationArguments): string {
					return `${args.property} must be a publicly reachable HTTPS/HTTP URL (private addresses and loopback are not allowed)`;
				},
			},
		});
	};
}
