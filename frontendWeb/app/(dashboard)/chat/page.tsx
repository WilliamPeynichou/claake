"use client";

import type { Agent, ChatSession } from "@claake/shared";
import { useChat } from "@claake/shared/hooks";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { ChatThread } from "@/components/chat/chat-thread";
import { ChatInputDA } from "@/components/chat/chat-input-da";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/lib/hooks/use-auth";

export default function ChatPage() {
	return (
		<Suspense fallback={<div className="flex h-full items-center justify-center"><p style={{ color:"#a09a8a" }}>Chargement…</p></div>}>
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
	} = useChat({ apiClient, token, agentId: selectedAgent?.id });

	// Load agents
	useEffect(() => {
		apiClient.agents.list({ limit: 50 }).then((res) => {
			setAgents(res.agents);
			if (agentParam) {
				const found = res.agents.find((a) => a.id === agentParam);
				if (found) setSelectedAgent(found);
			}
		}).catch(() => {});
	}, [agentParam]);

	const handleSelectSession = useCallback(async (sid: string) => {
		const session = sessions.find((s) => s.id === sid);
		if (session) {
			const agent = agents.find((a) => a.id === session.agent_id);
			if (agent) setSelectedAgent(agent);
		}
		await loadSession(sid);
	}, [agents, sessions, loadSession]);

	const handleNewChat = useCallback(async (agent: Agent) => {
		setSelectedAgent(agent);
		await createSession(agent.id);
		await refreshSessions();
	}, [createSession, refreshSessions]);

	const handleDeleteSession = useCallback(async (sid: string) => {
		await deleteSession(sid);
	}, [deleteSession]);

	if (authLoading) return <div className="flex h-full items-center justify-center" style={{ background:"#faf9f5" }}><p style={{ color:"#a09a8a" }}>Chargement…</p></div>;
	if (!token) return <div className="flex h-full items-center justify-center" style={{ background:"#faf9f5" }}><p style={{ color:"#a09a8a" }}>Connectez-vous pour accéder au chat.</p></div>;

	return (
		<div className="flex h-full" style={{ background:"#faf9f5" }}>
			<ChatSidebar
				agents={agents}
				sessions={sessions}
				activeSessionId={sessionId}
				onSelectAgent={setSelectedAgent}
				onSelectSession={handleSelectSession}
				onNewChat={handleNewChat}
				onDeleteSession={handleDeleteSession}
			/>
			<div className="flex flex-1 flex-col min-w-0">
				{selectedAgent && (
					<header className="flex items-center gap-3 px-6 py-4" style={{ borderBottom:"1px solid #e8e4d8", background:"#faf9f5" }}>
						<div className="h-8 w-8 flex items-center justify-center" style={{ background:"#e8ede0", border:"1px solid #d0dac4" }}>
							<span style={{ fontFamily:"'DM Serif Display', serif", color:"#6b7c5c", fontSize:"0.9rem" }}>
								{selectedAgent.name[0].toUpperCase()}
							</span>
						</div>
						<div>
							<p className="text-sm font-medium" style={{ color:"#1e1c18", fontFamily:"'DM Sans', system-ui" }}>{selectedAgent.name}</p>
							{selectedAgent.description && <p className="text-xs" style={{ color:"#a09a8a" }}>{selectedAgent.description}</p>}
						</div>
					</header>
				)}
				<ChatThread messages={messages} streaming={streaming} error={error} agentName={selectedAgent?.name} />
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
			</div>
		</div>
	);
}
