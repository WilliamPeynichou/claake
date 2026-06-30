import type { ValidationArguments, ValidationOptions } from "class-validator";
import { registerDecorator } from "class-validator";
import { isSyntacticallyPublicHttpUrl } from "../security/public-url.js";

export function IsPublicUrl(options?: ValidationOptions) {
	return function (object: object, propertyName: string) {
		registerDecorator({
			name: "isPublicUrl",
			target: object.constructor,
			propertyName,
			options,
			validator: {
				validate(value: unknown): boolean {
					return typeof value === "string" && isSyntacticallyPublicHttpUrl(value);
				},
				defaultMessage(args: ValidationArguments): string {
					return `${args.property} must be a publicly reachable HTTPS/HTTP URL (private addresses, loopback and credentials are not allowed)`;
				},
			},
		});
	};
}
