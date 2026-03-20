"use client";

import type { Agent } from "@claake/shared";
import { useChat } from "@claake/shared/hooks";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMain } from "@/components/chat/chat-main";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/lib/hooks/use-auth";

export default function ChatPage() {
	return (
		<Suspense fallback={<div className="flex h-full items-center justify-center"><p className="text-muted-foreground">Chargement...</p></div>}>
			<ChatPageInner />
		</Suspense>
	);
}

function ChatPageInner() {
	const searchParams = useSearchParams();
	const agentParam = searchParams.get("agent");
	const { token, loading: authLoading } = useAuth();
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
		token: token ?? "",
		agentId: selectedAgent?.id,
	});

	// Load agents list
	useEffect(() => {
		apiClient.agents
			.list({ all: true })
			.then((res) => {
				setAgents(res.agents);
				// Auto-select agent from URL param
				if (agentParam) {
					const found = res.agents.find((a) => a.id === agentParam);
					if (found) setSelectedAgent(found);
				}
			})
			.catch(() => {});
	}, [agentParam]);

	function handleSelectAgent(agent: Agent) {
		setSelectedAgent(agent);
	}

	async function handleSelectSession(sid: string) {
		// Find the agent for this session
		const session = sessions.find((s) => s.id === sid);
		if (session) {
			const agent = agents.find((a) => a.id === session.agent_id);
			if (agent) setSelectedAgent(agent);
		}
		await loadSession(sid);
	}

	async function handleNewChat(agent: Agent) {
		setSelectedAgent(agent);
		if (token) {
			await createSession(agent.id);
		}
	}

	if (authLoading) {
		return (
			<div className="flex h-full items-center justify-center">
				<p className="text-muted-foreground">Chargement...</p>
			</div>
		);
	}

	if (!token) {
		return (
			<div className="flex h-full items-center justify-center">
				<p className="text-muted-foreground">Connectez-vous pour accéder au chat.</p>
			</div>
		);
	}

	return (
		<div className="flex h-full">
			<ChatSidebar
				agents={agents}
				sessions={sessions}
				activeSessionId={sessionId}
				onSelectAgent={handleSelectAgent}
				onSelectSession={handleSelectSession}
				onNewChat={handleNewChat}
				onDeleteSession={deleteSession}
			/>
			<div className="flex flex-1 flex-col">
				<ChatMain
					messages={messages}
					loading={loading}
					streaming={streaming}
					error={error}
					selectedAgent={selectedAgent}
					sessionId={sessionId}
				/>
				<ChatInput
					input={input}
					setInput={setInput}
					onSend={sendMessage}
					disabled={loading || streaming || !selectedAgent}
				/>
			</div>
		</div>
	);
}
