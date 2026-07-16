import {
	Body,
	Controller,
	Get,
	Headers,
	Inject,
	Param,
	Post,
	RawBody,
	Req,
	UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { RATE_LIMITS } from "../../../../common/config/rate-limits.js";
import { SkipTransform } from "../../../../common/decorators/skip-transform.decorator.js";
import { SupabaseAuthGuard } from "../../../../common/guards/supabase-auth.guard.js";
import type { AuthenticatedRequest } from "../../../../common/types/authenticated-request.type.js";
import {
	USER_REPOSITORY,
	type UserRepositoryPort,
} from "../../../users/domain/ports/user.repository.port.js";
import { CheckoutRequestDto } from "../../application/dtos/checkout-request.dto.js";
import { CheckAccessUseCase } from "../../application/usecases/check-access.usecase.js";
import { CreateCheckoutUseCase } from "../../application/usecases/create-checkout.usecase.js";
import { CreateConnectAccountUseCase } from "../../application/usecases/create-connect-account.usecase.js";
import { HandleWebhookUseCase } from "../../application/usecases/handle-webhook.usecase.js";
import { ListPurchasesUseCase } from "../../application/usecases/list-purchases.usecase.js";
import { STRIPE_SERVICE, type StripeServicePort } from "../../domain/ports/stripe.port.js";

@Controller("payments")
export class PaymentController {
	constructor(
		private readonly createCheckout: CreateCheckoutUseCase,
		private readonly handleWebhook: HandleWebhookUseCase,
		private readonly listPurchases: ListPurchasesUseCase,
		private readonly checkAccess: CheckAccessUseCase,
		private readonly createConnectAccount: CreateConnectAccountUseCase,
		@Inject(STRIPE_SERVICE) private readonly stripe: StripeServicePort,
		@Inject(USER_REPOSITORY) private readonly userRepo: UserRepositoryPort,
	) {}

	@Post("checkout")
	@Throttle(RATE_LIMITS.paymentCheckout)
	@UseGuards(SupabaseAuthGuard)
	async checkout(@Body() dto: CheckoutRequestDto, @Req() req: AuthenticatedRequest) {
		return this.createCheckout.execute(dto.agent_id, req.user.id);
	}

	@Post("webhook")
	@Throttle(RATE_LIMITS.paymentWebhook)
	@SkipTransform()
	async webhook(@RawBody() rawBody: Buffer, @Headers("stripe-signature") signature: string) {
		return this.handleWebhook.execute(rawBody, signature);
	}

	@Get("purchases")
	@UseGuards(SupabaseAuthGuard)
	async purchases(@Req() req: AuthenticatedRequest) {
		return this.listPurchases.execute(req.user.id);
	}

	@Get("access/:agentId")
	@UseGuards(SupabaseAuthGuard)
	async access(@Param("agentId") agentId: string, @Req() req: AuthenticatedRequest) {
		return this.checkAccess.execute(agentId, req.user.id);
	}

	@Post("connect/onboard")
	@Throttle(RATE_LIMITS.stripeOnboarding)
	@UseGuards(SupabaseAuthGuard)
	async connectOnboard(@Req() req: AuthenticatedRequest) {
		return this.createConnectAccount.execute(req.user.id);
	}

	@Get("connect/status")
	@UseGuards(SupabaseAuthGuard)
	async connectStatus(@Req() req: AuthenticatedRequest) {
		const user = await this.userRepo.findById(req.user.id);
		if (!user?.stripeAccountId) {
			return { connected: false, details_submitted: false };
		}
		const status = await this.stripe.getAccountStatus(user.stripeAccountId);
		return { connected: true, ...status };
	}
}
