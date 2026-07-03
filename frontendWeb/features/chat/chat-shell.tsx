"use client";

import { AppSidebar } from "@/components/chat/app-sidebar";
import { Messages } from "@/components/chat/messages";
import { MultimodalInput } from "@/components/chat/multimodal-input";
import { AccessNotice } from "./components/access-notice";
import { ChatError } from "./components/chat-error";
import { ChatHeader } from "./components/chat-header";
import { LoginRequired } from "./components/login-required";
import { MissingApiKeyCard } from "./components/missing-api-key-card";
import { useAgentChat } from "./hooks/use-agent-chat";

function ChatLoading() {
	return (
		<div className="flex flex-1 items-center justify-center" style={{ background: "#faf9f5" }}>
			<span style={{ fontFamily: "'DM Sans', system-ui", fontSize: "0.85rem", color: "#a09a8a" }}>
				Chargement…
			</span>
		</div>
	);
}

interface ChatShellProps {
	agentId: string;
}

/**
 * Orchestrateur présentation du chat agent : sidebar, header, notices d'accès,
 * messages et input. Toute la logique métier vient de `useAgentChat`, qui
 * lui-même s'appuie sur le contrat backend `AgentChatConfig`.
 */
export function ChatShell({ agentId }: ChatShellProps) {
	const {
		token,
		loading,
		loginRequired,
		agents,
		currentAgent,
		chatConfig,
		chatConfigError,
		displayAgent,
		accessNotice,
		goToLogin,
		goToApiKeys,
		handleSelectSession,
		handleNewChat,
		handleDeleteSession,
		messages,
		input,
		setInput,
		streaming,
		error,
		sessionId,
		sessions,
		addPendingFile,
		removePendingFile,
		sendMessage,
		retry,
		canRetry,
	} = useAgentChat(agentId);

	if (loading) return <ChatLoading />;
	if (loginRequired) return <LoginRequired onLogin={goToLogin} />;

	return (
		<>
			<AppSidebar
				agentId={agentId}
				agents={agents}
				sessions={sessions}
				activeSessionId={sessionId}
				onSelectSession={handleSelectSession}
				onNewChat={handleNewChat}
				onDeleteSession={handleDeleteSession}
			/>

			<div className="flex flex-1 flex-col min-w-0" style={{ background: "#faf9f5" }}>
				<ChatHeader agent={displayAgent} />

				{chatConfigError && (
					<div className="mx-4 mt-4 border px-4 py-3 text-sm text-red-700">{chatConfigError}</div>
				)}

				{accessNotice?.reason === "api_key_required" && (
					<MissingApiKeyCard
						requiredProvider={accessNotice.required_provider}
						onAddKey={goToApiKeys}
					/>
				)}

				{(accessNotice?.reason === "purchase_required" ||
					accessNotice?.reason === "not_published") && (
					<AccessNotice reason={accessNotice.reason} />
				)}

				{error && <ChatError message={error} canRetry={canRetry} onRetry={retry} />}

				<Messages
					messages={messages}
					streaming={streaming}
					error={null}
					agentName={displayAgent?.name}
					agentInitial={displayAgent?.name?.[0]?.toUpperCase()}
					welcomeMessage={chatConfig?.welcome_message ?? currentAgent?.welcome_message}
					suggestedPrompts={chatConfig?.suggested_prompts ?? currentAgent?.suggested_prompts}
					onSuggestedPrompt={setInput}
				/>

				<MultimodalInput
					value={input}
					onChange={setInput}
					onSend={sendMessage}
					disabled={!!accessNotice || !!chatConfigError}
					streaming={streaming}
					stop={() => {}}
					token={token ?? undefined}
					sessionId={sessionId}
					currentAgent={currentAgent}
					capabilities={chatConfig?.capabilities}
					onFileUploaded={addPendingFile}
					onFileRemoved={removePendingFile}
				/>
			</div>
		</>
	);
}
