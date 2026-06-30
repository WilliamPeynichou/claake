"use client";

import type { Agent, AgentChatConfig } from "@claake/shared";
import { useChat } from "@claake/shared/hooks";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { AppSidebar } from "@/components/chat/app-sidebar";
import { Messages } from "@/components/chat/messages";
import { MultimodalInput } from "@/components/chat/multimodal-input";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/lib/hooks/use-auth";

export default function AgentChatPage() {
	return (
		<Suspense
			fallback={
				<div className="flex flex-1 items-center justify-center" style={{ background: "#faf9f5" }}>
					<span
						style={{ fontFamily: "'DM Sans', system-ui", fontSize: "0.85rem", color: "#a09a8a" }}
					>
						Chargement…
					</span>
				</div>
			}
		>
			<AgentChatInner />
		</Suspense>
	);
}

function AgentChatInner() {
	const params = useParams();
	const agentId = params.agentId as string;
	const router = useRouter();
	const { token, loading: authLoading } = useAuth();
	const [agents, setAgents] = useState<Agent[]>([]);
	const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
	const [chatConfig, setChatConfig] = useState<AgentChatConfig | null>(null);
	const [chatConfigLoading, setChatConfigLoading] = useState(true);
	const [chatConfigError, setChatConfigError] = useState<string | null>(null);

	const {
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
		loadSession,
		createSession,
		deleteSession,
		refreshSessions,
	} = useChat({ apiClient, token: token ?? "", agentId });

	// Load agents
	useEffect(() => {
		apiClient.agents
			.list({ limit: 100 })
			.then((res) => {
				setAgents(res.agents);
				const found = res.agents.find((a) => a.id === agentId);
				if (found) setCurrentAgent(found);
			})
			.catch(() => {});
	}, [agentId]);

	useEffect(() => {
		if (authLoading) return;
		setChatConfigLoading(true);
		setChatConfigError(null);
		apiClient.agents
			.chatConfig(agentId, token ?? undefined)
			.then(setChatConfig)
			.catch((err) => {
				setChatConfigError(
					err instanceof Error ? err.message : "Impossible de charger la configuration du chat.",
				);
			})
			.finally(() => setChatConfigLoading(false));
	}, [agentId, authLoading, token]);

	const handleSelectSession = useCallback(
		async (sid: string) => {
			await loadSession(sid);
		},
		[loadSession],
	);

	const handleNewChat = useCallback(async () => {
		await createSession(agentId);
		await refreshSessions();
	}, [agentId, createSession, refreshSessions]);

	const handleDeleteSession = useCallback(
		async (sid: string) => {
			await deleteSession(sid);
		},
		[deleteSession],
	);

	if (authLoading || chatConfigLoading) {
		return (
			<div className="flex flex-1 items-center justify-center" style={{ background: "#faf9f5" }}>
				<span style={{ fontFamily: "'DM Sans', system-ui", fontSize: "0.85rem", color: "#a09a8a" }}>
					Chargement…
				</span>
			</div>
		);
	}

	if (!token || chatConfig?.access.reason === "login_required") {
		return (
			<div
				className="flex flex-1 flex-col items-center justify-center gap-4"
				style={{ background: "#faf9f5" }}
			>
				<p style={{ fontFamily: "'DM Sans', system-ui", fontSize: "0.875rem", color: "#a09a8a" }}>
					Connectez-vous pour accéder au chat.
				</p>
				<button
					type="button"
					onClick={() => router.push("/login")}
					className="px-6 py-2"
					style={{
						background: "#6b7c5c",
						color: "#faf9f5",
						border: "1px solid #6b7c5c",
						fontFamily: "'DM Sans', system-ui",
						fontSize: "0.85rem",
						letterSpacing: "0.05em",
					}}
				>
					Se connecter
				</button>
			</div>
		);
	}

	const displayAgent = chatConfig ?? currentAgent;
	const accessNotice = chatConfig?.access.can_chat === false ? chatConfig.access : null;

	return (
		<>
			{/* Sidebar */}
			<AppSidebar
				agentId={agentId}
				agents={agents}
				sessions={sessions}
				activeSessionId={sessionId}
				onSelectSession={handleSelectSession}
				onNewChat={handleNewChat}
				onDeleteSession={handleDeleteSession}
			/>

			{/* Main chat area */}
			<div className="flex flex-1 flex-col min-w-0" style={{ background: "#faf9f5" }}>
				{/* Header */}
				{displayAgent && (
					<div
						className="flex items-center gap-3 px-5 py-3 shrink-0"
						style={{ borderBottom: "1px solid #e8e4d8", background: "#faf9f5" }}
					>
						{displayAgent.image_url ? (
							<img
								src={displayAgent.image_url}
								alt={displayAgent.name}
								className="h-8 w-8 object-cover shrink-0"
								style={{ borderRadius: "4px" }}
							/>
						) : (
							<div
								className="h-8 w-8 shrink-0 flex items-center justify-center"
								style={{
									background: "#e8ede0",
									border: "1px solid #d0dac4",
									fontFamily: "'DM Serif Display', serif",
									fontSize: "0.9rem",
									color: "#6b7c5c",
								}}
							>
								{displayAgent.name[0].toUpperCase()}
							</div>
						)}
						<div>
							<p
								style={{
									fontFamily: "'DM Sans', system-ui",
									fontSize: "0.875rem",
									fontWeight: 500,
									color: "#1e1c18",
								}}
							>
								{displayAgent.name}
							</p>
							{displayAgent.description && (
								<p
									style={{
										fontFamily: "'DM Sans', system-ui",
										fontSize: "0.72rem",
										color: "#a09a8a",
									}}
								>
									{displayAgent.description}
								</p>
							)}
						</div>
						{displayAgent.models?.[0] && (
							<div
								className="ml-auto"
								style={{
									fontFamily: "'DM Sans', system-ui",
									fontSize: "0.68rem",
									color: "#6b6558",
									letterSpacing: "0.05em",
									textTransform: "uppercase",
									border: "1px solid #e8e4d8",
									padding: "0.2rem 0.6rem",
								}}
							>
								{displayAgent.models[0].split("/").pop()?.split("-").slice(0, 2).join(" ") ??
									displayAgent.models[0]}
							</div>
						)}
					</div>
				)}

				{chatConfigError && (
					<div className="mx-4 mt-4 border px-4 py-3 text-sm text-red-700">{chatConfigError}</div>
				)}

				{accessNotice?.reason === "api_key_required" && (
					<div className="mx-4 mt-4 flex items-center justify-between gap-3 border px-4 py-3 text-sm">
						<span>
							Cet agent nécessite une clé API {accessNotice.required_provider ?? "IA"} pour être
							utilisé.
						</span>
						<button
							type="button"
							onClick={() => router.push("/dashboard/api-keys")}
							className="shrink-0 px-3 py-2"
							style={{ background: "#6b7c5c", color: "#faf9f5" }}
						>
							Ajouter une clé
						</button>
					</div>
				)}

				{accessNotice?.reason === "purchase_required" && (
					<div className="mx-4 mt-4 border px-4 py-3 text-sm text-amber-700">
						Un achat est requis pour utiliser cet agent.
					</div>
				)}

				{accessNotice?.reason === "not_published" && (
					<div className="mx-4 mt-4 border px-4 py-3 text-sm text-amber-700">
						Cet agent n'est pas publié.
					</div>
				)}

				{/* Messages */}
				<Messages
					messages={messages}
					streaming={streaming}
					error={error}
					agentName={displayAgent?.name}
					agentInitial={displayAgent?.name?.[0]?.toUpperCase()}
					welcomeMessage={chatConfig?.welcome_message ?? currentAgent?.welcome_message}
					suggestedPrompts={chatConfig?.suggested_prompts ?? currentAgent?.suggested_prompts}
					onSuggestedPrompt={setInput}
				/>

				{/* Input */}
				<MultimodalInput
					value={input}
					onChange={setInput}
					onSend={sendMessage}
					disabled={!!accessNotice || !!chatConfigError}
					streaming={streaming}
					stop={() => {}}
					token={token}
					sessionId={sessionId}
					currentAgent={currentAgent}
					onFileUploaded={addPendingFile}
					onFileRemoved={removePendingFile}
				/>
			</div>
		</>
	);
}
