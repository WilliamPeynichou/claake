import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module.js";
import { AgentModule } from "../agents/agent.module.js";
import { UploadsModule } from "../uploads/uploads.module.js";
import { ManageApiKeysUseCase } from "../users/application/usecases/manage-api-keys.usecase.js";
import { UserModule } from "../users/user.module.js";
import { ChatObservabilityService } from "./application/services/chat-observability.service.js";
import { ChatQuotaService } from "./application/services/chat-quota.service.js";
import {
	EXECUTION_STRATEGY_RESOLVER,
	ExecutionStrategyResolver,
} from "./application/services/execution-strategy.resolver.js";
import { MANAGE_API_KEYS_USE_CASE } from "./application/services/manage-api-keys.port.js";
import { ToolRegistryService } from "./application/services/tool-registry.service.js";
import { CreateSessionUseCase } from "./application/usecases/create-session.usecase.js";
import { DeleteSessionUseCase } from "./application/usecases/delete-session.usecase.js";
import { GetSessionMessagesUseCase } from "./application/usecases/get-session-messages.usecase.js";
import { ListSessionsUseCase } from "./application/usecases/list-sessions.usecase.js";
import { SendMessageUseCase } from "./application/usecases/send-message.usecase.js";
import { AI_PROVIDER_FACTORY } from "./domain/ports/ai-provider.port.js";
import { CHAT_SESSION_REPOSITORY } from "./domain/ports/chat-session.repository.port.js";
import { ChatController } from "./infrastructure/controllers/chat.controller.js";
import { AIProviderFactory } from "./infrastructure/providers/ai-provider.factory.js";
import { AnthropicProvider } from "./infrastructure/providers/anthropic.provider.js";
import { EndpointProxyProvider } from "./infrastructure/providers/endpoint-proxy.provider.js";
import { MockProvider } from "./infrastructure/providers/mock.provider.js";
import { OpenAIProvider } from "./infrastructure/providers/openai.provider.js";
import { PrismaChatRepository } from "./infrastructure/repositories/prisma-chat.repository.js";

@Module({
	imports: [AgentModule, UserModule, PrismaModule, UploadsModule],
	controllers: [ChatController],
	providers: [
		CreateSessionUseCase,
		ListSessionsUseCase,
		GetSessionMessagesUseCase,
		SendMessageUseCase,
		DeleteSessionUseCase,
		AnthropicProvider,
		OpenAIProvider,
		EndpointProxyProvider,
		MockProvider,
		AIProviderFactory,
		ExecutionStrategyResolver,
		ChatQuotaService,
		ChatObservabilityService,
		ToolRegistryService,
		ManageApiKeysUseCase,
		{ provide: CHAT_SESSION_REPOSITORY, useClass: PrismaChatRepository },
		{ provide: AI_PROVIDER_FACTORY, useExisting: AIProviderFactory },
		{ provide: EXECUTION_STRATEGY_RESOLVER, useExisting: ExecutionStrategyResolver },
		{ provide: MANAGE_API_KEYS_USE_CASE, useExisting: ManageApiKeysUseCase },
	],
	exports: [CHAT_SESSION_REPOSITORY],
})
export class ChatModule {}
