import type { Agent } from "@claake/shared";
import { useChat } from "@claake/shared/hooks";
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
		setSelectedAgent(null);
		setSearchParams({});
	}, [setSearchParams]);

	return (
		<div className="flex h-screen">
			<ChatSidebar
				agents={agents}
				sessions={sessions}
				selectedAgentId={selectedAgent?.id ?? null}
				activeSessionId={sessionId}
				onSelectAgent={handleSelectAgent}
				onSelectSession={handleSelectSession}
				onDeleteSession={deleteSession}
				onNewChat={handleNewChat}
				onSignOut={signOut}
				userName={profile?.display_name ?? profile?.email ?? null}
			/>

			<div className="flex flex-1 flex-col">
				{/* Top bar */}
				{selectedAgent && (
					<div className="flex items-center gap-2 border-b px-4 py-2.5">
						<span className="text-sm font-medium">{selectedAgent.name}</span>
						<span className="text-xs text-muted-foreground">{selectedAgent.description}</span>
					</div>
				)}

				<ChatMessages
					messages={messages}
					loading={loading}
					streaming={streaming}
					error={error}
					agentName={selectedAgent?.name ?? null}
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
			</div>
		</div>
	);
}
