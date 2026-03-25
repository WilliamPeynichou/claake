import { Module } from "@nestjs/common";
import { AgentModule } from "../agents/agent.module.js";
import { UserModule } from "../users/user.module.js";
import { CheckAccessUseCase } from "./application/usecases/check-access.usecase.js";
import { CreateCheckoutUseCase } from "./application/usecases/create-checkout.usecase.js";
import { CreateConnectAccountUseCase } from "./application/usecases/create-connect-account.usecase.js";
import { GetCreatorEarningsUseCase } from "./application/usecases/get-creator-earnings.usecase.js";
import { HandleWebhookUseCase } from "./application/usecases/handle-webhook.usecase.js";
import { ListPurchasesUseCase } from "./application/usecases/list-purchases.usecase.js";
import { PAYMENT_REPOSITORY } from "./domain/ports/payment.repository.port.js";
import { STRIPE_SERVICE } from "./domain/ports/stripe.port.js";
import { PaymentController } from "./infrastructure/controllers/payment.controller.js";
import { PrismaPaymentRepository } from "./infrastructure/repositories/prisma-payment.repository.js";
import { StripeService } from "./infrastructure/stripe/stripe.service.js";

@Module({
	imports: [AgentModule, UserModule],
	controllers: [PaymentController],
	providers: [
		CreateCheckoutUseCase,
		HandleWebhookUseCase,
		ListPurchasesUseCase,
		CheckAccessUseCase,
		CreateConnectAccountUseCase,
		GetCreatorEarningsUseCase,
		{ provide: STRIPE_SERVICE, useClass: StripeService },
		{ provide: PAYMENT_REPOSITORY, useClass: PrismaPaymentRepository },
	],
	exports: [PAYMENT_REPOSITORY],
})
export class PaymentModule {}
