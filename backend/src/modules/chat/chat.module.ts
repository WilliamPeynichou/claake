import { Module } from "@nestjs/common";
import { AgentModule } from "../agents/agent.module.js";
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
import { OpenAIProvider } from "./infrastructure/providers/openai.provider.js";
import { PrismaChatRepository } from "./infrastructure/repositories/prisma-chat.repository.js";

@Module({
	imports: [AgentModule],
	controllers: [ChatController],
	providers: [
		CreateSessionUseCase,
		ListSessionsUseCase,
		GetSessionMessagesUseCase,
		SendMessageUseCase,
		DeleteSessionUseCase,
		AnthropicProvider,
		OpenAIProvider,
		AIProviderFactory,
		{ provide: CHAT_SESSION_REPOSITORY, useClass: PrismaChatRepository },
		{ provide: AI_PROVIDER_FACTORY, useExisting: AIProviderFactory },
	],
})
export class ChatModule {}
