import { Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { SupabaseAuthGuard } from "../../../../common/guards/supabase-auth.guard.js";
import type { AuthenticatedRequest } from "../../../../common/types/authenticated-request.type.js";
import { CheckFavoriteUseCase } from "../../application/usecases/check-favorite.usecase.js";
import { ListFavoritesUseCase } from "../../application/usecases/list-favorites.usecase.js";
import { ToggleFavoriteUseCase } from "../../application/usecases/toggle-favorite.usecase.js";

@Controller("favorites")
@UseGuards(SupabaseAuthGuard)
export class FavoriteController {
	constructor(
		private readonly toggleFavorite: ToggleFavoriteUseCase,
		private readonly listFavorites: ListFavoritesUseCase,
		private readonly checkFavorite: CheckFavoriteUseCase,
	) {}

	@Post(":agentId")
	async toggle(@Param("agentId") agentId: string, @Req() req: AuthenticatedRequest) {
		return this.toggleFavorite.execute(req.user.id, agentId);
	}

	@Get()
	async list(@Req() req: AuthenticatedRequest) {
		return this.listFavorites.execute(req.user.id);
	}

	@Get("check/:agentId")
	async check(@Param("agentId") agentId: string, @Req() req: AuthenticatedRequest) {
		return this.checkFavorite.execute(req.user.id, agentId);
	}
}
