import type { Agent } from "@claake/shared";
import { useChat } from "@claake/shared/hooks";
import { Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChatInput } from "@/components/chat-input";
import { ChatMessages } from "@/components/chat-messages";
import { ChatSidebar } from "@/components/chat-sidebar";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export function ChatPage() {
	const { token, profile, signOut } = useAuth();
	const [searchParams, setSearchParams] = useSearchParams();
	const [agents, setAgents] = useState<Agent[]>([]);
	const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

	const {
		messages,
		input,
		setInput,
		loading,
		streaming,
		error,
		sessionId,
		sessions,
		sendMessage,
		loadSession,
		createSession,
		deleteSession,
	} = useChat({
		apiClient,
		token,
		agentId: selectedAgent?.id,
	});

	// Load agents
	useEffect(() => {
		apiClient.agents.list({ limit: 100 }).then((res) => setAgents(res.agents));
	}, []);

	// Auto-select agent from URL param
	useEffect(() => {
		const agentParam = searchParams.get("agent");
		if (agentParam && agents.length > 0 && !selectedAgent) {
			const found = agents.find((a) => a.id === agentParam);
			if (found) setSelectedAgent(found);
		}
	}, [searchParams, agents, selectedAgent]);

	const handleSelectAgent = useCallback(
		async (agent: Agent) => {
			setSelectedAgent(agent);
			setSearchParams({ agent: agent.id });
			await createSession(agent.id);
		},
		[createSession, setSearchParams],
	);

	const handleSelectSession = useCallback(
		async (session: { id: string; agent_id: string; agent_name: string }) => {
			const agent = agents.find((a) => a.id === session.agent_id);
			if (agent) setSelectedAgent(agent);
			await loadSession(session.id);
		},
		[agents, loadSession],
	);

	const handleNewChat = useCallback(() => {
		const webUrl = import.meta.env.VITE_WEB_URL ?? "http://localhost:3000";
		window.open(`${webUrl}/catalogue`, "_blank");
	}, []);

	const handleResumeConversation = useCallback(() => {
		if (sessions.length > 0) {
			handleSelectSession(sessions[0]);
		}
	}, [sessions, handleSelectSession]);

	const handleStartWithAgent = useCallback(() => {
		const webUrl = import.meta.env.VITE_WEB_URL ?? "http://localhost:3000";
		window.open(`${webUrl}/catalogue`, "_blank");
	}, []);

	return (
		<div className="flex h-screen">
			<ChatSidebar
				sessions={sessions}
				activeSessionId={sessionId}
				onSelectSession={handleSelectSession}
				onDeleteSession={deleteSession}
				onNewChat={handleNewChat}
				onSignOut={signOut}
				userName={profile?.display_name ?? profile?.email ?? null}
			/>

			<main className="flex flex-1 flex-col">
				{/* Top bar */}
				{selectedAgent && (
					<header
						className="flex items-center gap-4 border-b px-6 py-5"
						style={{ background: "#faf9f5", borderColor: "#e8e4d8" }}
					>
						<div
							className="flex h-8 w-8 shrink-0 items-center justify-center"
							style={{ background: "#e8f2ec" }}
						>
							<Sparkles className="h-4 w-4" style={{ color: "#2a7a44" }} />
						</div>
						<div>
							<p className="text-sm font-medium" style={{ color: "#1e1c18" }}>
								{selectedAgent.name}
							</p>
							{selectedAgent.description && (
								<p className="text-xs" style={{ color: "#766f62" }}>
									{selectedAgent.description}
								</p>
							)}
						</div>
					</header>
				)}

				<ChatMessages
					messages={messages}
					loading={loading}
					streaming={streaming}
					error={error}
					agentName={selectedAgent?.name ?? null}
					onResumeConversation={handleResumeConversation}
					onStartWithAgent={handleStartWithAgent}
				/>

				{selectedAgent && (
					<ChatInput
						value={input}
						onChange={setInput}
						onSend={sendMessage}
						disabled={streaming || !selectedAgent}
						streaming={streaming}
					/>
				)}
			</main>
		</div>
	);
}
