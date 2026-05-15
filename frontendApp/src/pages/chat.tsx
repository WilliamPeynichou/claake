import type { Agent } from "@claake/shared";
import { useChat } from "@claake/shared/hooks";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChatInputDA } from "@/components/chat-input-da";
import { ChatSidebar } from "@/components/chat-sidebar";
import { ChatThread } from "@/components/chat-thread";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export function ChatPage() {
	const { token, profile, signOut } = useAuth();
	const [searchParams, setSearchParams] = useSearchParams();
	const agentParam = searchParams.get("agent");
	const [agents, setAgents] = useState<Agent[]>([]);
	const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

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
	} = useChat({ apiClient, token, agentId: selectedAgent?.id });

	// Load agents
	useEffect(() => {
		apiClient.agents
			.list({ limit: 100 })
			.then((res) => {
				setAgents(res.agents);
				if (agentParam) {
					const found = res.agents.find((a) => a.id === agentParam);
					if (found) setSelectedAgent(found);
				}
			})
			.catch(() => {});
	}, [agentParam]);

	const handleSelectSession = useCallback(
		async (session: { id: string; agent_id: string; agent_name: string }) => {
			const agent = agents.find((a) => a.id === session.agent_id);
			if (agent) setSelectedAgent(agent);
			await loadSession(session.id);
		},
		[agents, loadSession],
	);

	const handleNewChat = useCallback(
		async (agent: Agent) => {
			setSelectedAgent(agent);
			setSearchParams({ agent: agent.id });
			await createSession(agent.id);
			await refreshSessions();
		},
		[createSession, refreshSessions, setSearchParams],
	);

	return (
		<div className="flex h-screen" style={{ background: "#faf9f5" }}>
			<ChatSidebar
				agents={agents}
				sessions={sessions}
				activeSessionId={sessionId}
				onSelectSession={handleSelectSession}
				onNewChat={handleNewChat}
				onDeleteSession={deleteSession}
				onSignOut={signOut}
				userName={profile?.display_name ?? profile?.email ?? null}
			/>

			<main className="flex flex-1 flex-col min-w-0">
				{selectedAgent && (
					<header
						className="flex items-center gap-3 px-6 py-4"
						style={{ borderBottom: "1px solid #e8e4d8", background: "#faf9f5" }}
					>
						<div
							className="h-8 w-8 flex items-center justify-center"
							style={{ background: "#e8ede0", border: "1px solid #d0dac4" }}
						>
							<span
								style={{
									fontFamily: "'DM Serif Display', serif",
									color: "#6b7c5c",
									fontSize: "0.9rem",
								}}
							>
								{selectedAgent.name[0].toUpperCase()}
							</span>
						</div>
						<div>
							<p
								className="text-sm font-medium"
								style={{ color: "#1e1c18", fontFamily: "'DM Sans', system-ui" }}
							>
								{selectedAgent.name}
							</p>
							{selectedAgent.description && (
								<p className="text-xs" style={{ color: "#a09a8a" }}>
									{selectedAgent.description}
								</p>
							)}
						</div>
					</header>
				)}

				<ChatThread
					messages={messages}
					streaming={streaming}
					error={error}
					agentName={selectedAgent?.name}
				/>

				<ChatInputDA
					value={input}
					onChange={setInput}
					onSend={sendMessage}
					disabled={!sessionId}
					streaming={streaming}
					stop={() => {}}
					token={token}
					sessionId={sessionId}
					onFileUploaded={addPendingFile}
					onFileRemoved={removePendingFile}
				/>
			</main>
		</div>
	);
}
