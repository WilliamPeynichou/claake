import { ChatController } from "../../modules/chat/infrastructure/controllers/chat.controller";
import { PaymentController } from "../../modules/payments/infrastructure/controllers/payment.controller";
import { UploadController } from "../../modules/uploads/infrastructure/controllers/upload.controller";
import { AuthController } from "../../modules/users/infrastructure/controllers/user.controller";
import { RATE_LIMITS } from "./rate-limits";

function throttlerMetadata(target: object, method: string): { limit: number; ttl: number } {
	const handler = Object.getOwnPropertyDescriptor(target, method)?.value;
	if (!handler) throw new Error(`Missing controller method ${method}`);
	return {
		limit: Reflect.getMetadata("THROTTLER:LIMITdefault", handler),
		ttl: Reflect.getMetadata("THROTTLER:TTLdefault", handler),
	};
}

describe("sensitive route rate limits", () => {
	it.each([
		[ChatController.prototype, "sendMsg", RATE_LIMITS.chatMessage.default],
		[UploadController.prototype, "upload", RATE_LIMITS.upload.default],
		[PaymentController.prototype, "checkout", RATE_LIMITS.paymentCheckout.default],
		[PaymentController.prototype, "webhook", RATE_LIMITS.paymentWebhook.default],
		[PaymentController.prototype, "connectOnboard", RATE_LIMITS.stripeOnboarding.default],
		[AuthController.prototype, "addApiKey", RATE_LIMITS.apiKeyMutation.default],
		[AuthController.prototype, "removeApiKey", RATE_LIMITS.apiKeyMutation.default],
	])("sets a dedicated limit on %s.%s", (controller, method, expected) => {
		expect(throttlerMetadata(controller, method as string)).toEqual(expected);
	});
});
