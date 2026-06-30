import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { SupabaseAuthGuard } from "../../../../common/guards/supabase-auth.guard.js";
import { CreateCollectionDto } from "../../application/dtos/create-collection.dto.js";
import { UpdateCollectionDto } from "../../application/dtos/update-collection.dto.js";
import { AddAgentToCollectionUseCase } from "../../application/usecases/add-agent-to-collection.usecase.js";
import { CreateCollectionUseCase } from "../../application/usecases/create-collection.usecase.js";
import { DeleteCollectionUseCase } from "../../application/usecases/delete-collection.usecase.js";
import { GetCollectionUseCase } from "../../application/usecases/get-collection.usecase.js";
import { ListCollectionsUseCase } from "../../application/usecases/list-collections.usecase.js";
import { RemoveAgentFromCollectionUseCase } from "../../application/usecases/remove-agent-from-collection.usecase.js";
import { UpdateCollectionUseCase } from "../../application/usecases/update-collection.usecase.js";

@Controller("collections")
@UseGuards(SupabaseAuthGuard)
export class CollectionController {
	constructor(
		private readonly createCollection: CreateCollectionUseCase,
		private readonly listCollections: ListCollectionsUseCase,
		private readonly getCollection: GetCollectionUseCase,
		private readonly updateCollection: UpdateCollectionUseCase,
		private readonly deleteCollection: DeleteCollectionUseCase,
		private readonly addAgent: AddAgentToCollectionUseCase,
		private readonly removeAgent: RemoveAgentFromCollectionUseCase,
	) {}

	@Post()
	async create(@Body() dto: CreateCollectionDto, @Req() req: any) {
		return this.createCollection.execute(dto, req.user.id);
	}

	@Get()
	async list(@Req() req: any) {
		return this.listCollections.execute(req.user.id);
	}

	@Get(":id")
	async findOne(@Param("id") id: string, @Req() req: any) {
		return this.getCollection.execute(id, req.user.id);
	}

	@Patch(":id")
	async update(@Param("id") id: string, @Body() dto: UpdateCollectionDto, @Req() req: any) {
		return this.updateCollection.execute(id, dto, req.user.id);
	}

	@Delete(":id")
	async remove(@Param("id") id: string, @Req() req: any) {
		return this.deleteCollection.execute(id, req.user.id);
	}

	@Post(":id/agents/:agentId")
	async addAgentToCollection(
		@Param("id") id: string,
		@Param("agentId") agentId: string,
		@Req() req: any,
	) {
		return this.addAgent.execute(id, agentId, req.user.id);
	}

	@Delete(":id/agents/:agentId")
	async removeAgentFromCollection(
		@Param("id") id: string,
		@Param("agentId") agentId: string,
		@Req() req: any,
	) {
		return this.removeAgent.execute(id, agentId, req.user.id);
	}
}
