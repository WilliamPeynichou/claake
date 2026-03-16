import { Module } from "@nestjs/common";
import { AgentModule } from "../agents/agent.module.js";
import { ChatModule } from "../chat/chat.module.js";
import { PaymentModule } from "../payments/payment.module.js";
import { CreateReviewUseCase } from "./application/usecases/create-review.usecase.js";
import { DeleteReviewUseCase } from "./application/usecases/delete-review.usecase.js";
import { ListReviewsUseCase } from "./application/usecases/list-reviews.usecase.js";
import { UpdateReviewUseCase } from "./application/usecases/update-review.usecase.js";
import { REVIEW_REPOSITORY } from "./domain/ports/review.repository.port.js";
import { ReviewController } from "./infrastructure/controllers/review.controller.js";
import { PrismaReviewRepository } from "./infrastructure/repositories/prisma-review.repository.js";

@Module({
	imports: [AgentModule, PaymentModule, ChatModule],
	controllers: [ReviewController],
	providers: [
		CreateReviewUseCase,
		UpdateReviewUseCase,
		DeleteReviewUseCase,
		ListReviewsUseCase,
		{ provide: REVIEW_REPOSITORY, useClass: PrismaReviewRepository },
	],
})
export class ReviewModule {}
