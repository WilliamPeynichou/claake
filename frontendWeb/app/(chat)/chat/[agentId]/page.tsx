"use client";

import type { Agent } from "@claake/shared";
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
		<Suspense fallback={
			<div className="flex flex-1 items-center justify-center" style={{ background: "#faf9f5" }}>
				<span style={{ fontFamily: "'DM Sans', system-ui", fontSize: "0.85rem", color: "#a09a8a" }}>
					Chargement…
				</span>
			</div>
		}>
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

	const {
		messages,
		input,
		setInput,
		streaming,
		error,
		sessionId,
		sessions,
		pendingFileIds,
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
		apiClient.agents.list({ limit: 100 }).then((res) => {
			setAgents(res.agents);
			const found = res.agents.find((a) => a.id === agentId);
			if (found) setCurrentAgent(found);
		}).catch(() => {});
	}, [agentId]);

	const handleSelectSession = useCallback(async (sid: string) => {
		await loadSession(sid);
	}, [loadSession]);

	const handleNewChat = useCallback(async () => {
		await createSession(agentId);
		await refreshSessions();
	}, [agentId, createSession, refreshSessions]);

	const handleDeleteSession = useCallback(async (sid: string) => {
		await deleteSession(sid);
	}, [deleteSession]);

	if (authLoading) {
		return (
			<div className="flex flex-1 items-center justify-center" style={{ background: "#faf9f5" }}>
				<span style={{ fontFamily: "'DM Sans', system-ui", fontSize: "0.85rem", color: "#a09a8a" }}>
					Chargement…
				</span>
			</div>
		);
	}

	if (!token) {
		return (
			<div className="flex flex-1 flex-col items-center justify-center gap-4" style={{ background: "#faf9f5" }}>
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
				{currentAgent && (
					<div
						className="flex items-center gap-3 px-5 py-3 shrink-0"
						style={{ borderBottom: "1px solid #e8e4d8", background: "#faf9f5" }}
					>
						{currentAgent.image_url ? (
							<img
								src={currentAgent.image_url}
								alt={currentAgent.name}
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
								{currentAgent.name[0].toUpperCase()}
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
								{currentAgent.name}
							</p>
							{currentAgent.description && (
								<p
									style={{
										fontFamily: "'DM Sans', system-ui",
										fontSize: "0.72rem",
										color: "#a09a8a",
									}}
								>
									{currentAgent.description}
								</p>
							)}
						</div>
						{currentAgent.models?.[0] && (
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
								{currentAgent.models[0].split("/").pop()?.split("-").slice(0, 2).join(" ") ?? currentAgent.models[0]}
							</div>
						)}
					</div>
				)}

				{/* Messages */}
				<Messages
					messages={messages}
					streaming={streaming}
					error={error}
					agentName={currentAgent?.name}
					agentInitial={currentAgent?.name?.[0]?.toUpperCase()}
				/>

				{/* Input */}
				<MultimodalInput
					value={input}
					onChange={setInput}
					onSend={sendMessage}
					disabled={false}
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
