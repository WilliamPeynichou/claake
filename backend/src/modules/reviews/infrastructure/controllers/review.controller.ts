import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
	Query,
	Req,
	UseGuards,
} from "@nestjs/common";
import { SupabaseAuthGuard } from "../../../../common/guards/supabase-auth.guard.js";
import type { CreateReviewDto } from "../../application/dtos/create-review.dto.js";
import { CreateReviewUseCase } from "../../application/usecases/create-review.usecase.js";
import { DeleteReviewUseCase } from "../../application/usecases/delete-review.usecase.js";
import { ListReviewsUseCase } from "../../application/usecases/list-reviews.usecase.js";
import { UpdateReviewUseCase } from "../../application/usecases/update-review.usecase.js";

@Controller("agents/:agentId/reviews")
export class ReviewController {
	constructor(
		private readonly createReview: CreateReviewUseCase,
		private readonly updateReview: UpdateReviewUseCase,
		private readonly deleteReview: DeleteReviewUseCase,
		private readonly listReviews: ListReviewsUseCase,
	) {}

	@Get()
	async list(
		@Param("agentId") agentId: string,
		@Query("page") page?: string,
		@Query("limit") limit?: string,
	) {
		return this.listReviews.execute(
			agentId,
			page ? Number(page) : 1,
			limit ? Number(limit) : 10,
		);
	}

	@Post()
	@UseGuards(SupabaseAuthGuard)
	async create(
		@Param("agentId") agentId: string,
		@Body() dto: CreateReviewDto,
		@Req() req: any,
	) {
		return this.createReview.execute(agentId, dto, req.user.id);
	}

	@Patch(":reviewId")
	@UseGuards(SupabaseAuthGuard)
	async update(
		@Param("reviewId") reviewId: string,
		@Body() body: { rating?: number; comment?: string },
		@Req() req: any,
	) {
		return this.updateReview.execute(reviewId, body, req.user.id);
	}

	@Delete(":reviewId")
	@UseGuards(SupabaseAuthGuard)
	async remove(@Param("reviewId") reviewId: string, @Req() req: any) {
		return this.deleteReview.execute(reviewId, req.user.id, req.user.role);
	}
}
