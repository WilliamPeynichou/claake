import type { ValidationArguments, ValidationOptions } from "class-validator";
import { registerDecorator } from "class-validator";
import { assertPublicHttpUrl, isSyntacticallyPublicHttpUrl } from "../security/public-url.js";

export function IsPublicUrl(options?: ValidationOptions) {
	return (object: object, propertyName: string) => {
		registerDecorator({
			name: "isPublicUrl",
			target: object.constructor,
			propertyName,
			options,
			async: true,
			validator: {
				async validate(value: unknown): Promise<boolean> {
					if (typeof value !== "string" || !isSyntacticallyPublicHttpUrl(value)) {
						return false;
					}
					// Effective DNS resolution: reject hostnames resolving to private,
					// loopback or otherwise blocked addresses (SSRF defense at config time;
					// URLs are re-checked at request time by assertPublicHttpUrl callers).
					try {
						await assertPublicHttpUrl(value);
						return true;
					} catch {
						return false;
					}
				},
				defaultMessage(args: ValidationArguments): string {
					return `${args.property} must be a publicly reachable HTTPS/HTTP URL (private addresses, loopback and credentials are not allowed)`;
				},
			},
		});
	};
}
