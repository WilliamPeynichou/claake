import type { Agent, ChatSession } from "@claake/shared";
import { Bot, LogOut, MessageSquare, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

interface ChatSidebarProps {
	agents: Agent[];
	sessions: ChatSession[];
	selectedAgentId: string | null;
	activeSessionId: string | null;
	onSelectAgent: (agent: Agent) => void;
	onSelectSession: (session: ChatSession) => void;
	onDeleteSession: (sessionId: string) => void;
	onNewChat: () => void;
	onSignOut: () => void;
	userName: string | null;
}

export function ChatSidebar({
	agents,
	sessions,
	selectedAgentId,
	activeSessionId,
	onSelectAgent,
	onSelectSession,
	onDeleteSession,
	onNewChat,
	onSignOut,
	userName,
}: ChatSidebarProps) {
	const [search, setSearch] = useState("");
	const [tab, setTab] = useState<"sessions" | "agents">("sessions");

	const filteredAgents = useMemo(() => {
		if (!search) return agents;
		const q = search.toLowerCase();
		return agents.filter(
			(a) => a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q),
		);
	}, [agents, search]);

	const filteredSessions = useMemo(() => {
		if (!search) return sessions;
		const q = search.toLowerCase();
		return sessions.filter(
			(s) =>
				s.agent_name.toLowerCase().includes(q) ||
				s.title?.toLowerCase().includes(q) ||
				s.last_message_preview?.toLowerCase().includes(q),
		);
	}, [sessions, search]);

	const groupedSessions = useMemo(() => {
		const now = new Date();
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const yesterday = new Date(today.getTime() - 86400000);
		const weekAgo = new Date(today.getTime() - 7 * 86400000);

		const groups: { label: string; sessions: ChatSession[] }[] = [
			{ label: "Aujourd'hui", sessions: [] },
			{ label: "Hier", sessions: [] },
			{ label: "Cette semaine", sessions: [] },
			{ label: "Plus ancien", sessions: [] },
		];

		for (const s of filteredSessions) {
			const d = new Date(s.updated_at);
			if (d >= today) groups[0].sessions.push(s);
			else if (d >= yesterday) groups[1].sessions.push(s);
			else if (d >= weekAgo) groups[2].sessions.push(s);
			else groups[3].sessions.push(s);
		}

		return groups.filter((g) => g.sessions.length > 0);
	}, [filteredSessions]);

	return (
		<div className="flex h-full w-72 flex-col border-r bg-card">
			{/* Header */}
			<div className="flex items-center justify-between border-b px-4 py-3">
				<div className="flex items-center gap-2">
					<Bot className="h-5 w-5 text-primary" />
					<span className="font-semibold">Claake</span>
				</div>
				<button
					type="button"
					onClick={onNewChat}
					className="rounded-lg p-1.5 hover:bg-accent"
					title="Nouvelle conversation"
				>
					<Plus className="h-4 w-4" />
				</button>
			</div>

			{/* Search */}
			<div className="px-3 py-2">
				<div className="relative">
					<Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
					<input
						type="text"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Rechercher..."
						className="w-full rounded-lg border bg-background py-1.5 pl-8 pr-3 text-sm outline-none focus:ring-1 focus:ring-primary"
					/>
				</div>
			</div>

			{/* Tabs */}
			<div className="flex border-b px-3">
				<button
					type="button"
					onClick={() => setTab("sessions")}
					className={`flex-1 py-2 text-xs font-medium ${
						tab === "sessions"
							? "border-b-2 border-primary text-primary"
							: "text-muted-foreground hover:text-foreground"
					}`}
				>
					Conversations
				</button>
				<button
					type="button"
					onClick={() => setTab("agents")}
					className={`flex-1 py-2 text-xs font-medium ${
						tab === "agents"
							? "border-b-2 border-primary text-primary"
							: "text-muted-foreground hover:text-foreground"
					}`}
				>
					Agents
				</button>
			</div>

			{/* Content */}
			<div className="flex-1 overflow-y-auto">
				{tab === "sessions" ? (
					groupedSessions.length === 0 ? (
						<div className="p-4 text-center text-sm text-muted-foreground">Aucune conversation</div>
					) : (
						groupedSessions.map((group) => (
							<div key={group.label}>
								<div className="px-3 py-2 text-xs font-medium text-muted-foreground">
									{group.label}
								</div>
								{group.sessions.map((session) => (
									<button
										type="button"
										key={session.id}
										onClick={() => onSelectSession(session)}
										className={`group flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-accent ${
											activeSessionId === session.id ? "bg-accent" : ""
										}`}
									>
										<MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
										<div className="min-w-0 flex-1">
											<div className="truncate text-sm font-medium">
												{session.title ?? session.agent_name}
											</div>
											{session.last_message_preview && (
												<div className="truncate text-xs text-muted-foreground">
													{session.last_message_preview}
												</div>
											)}
										</div>
										<button
											type="button"
											onClick={(e) => {
												e.stopPropagation();
												onDeleteSession(session.id);
											}}
											className="mt-0.5 shrink-0 rounded p-0.5 opacity-0 hover:bg-destructive/20 hover:text-destructive group-hover:opacity-100"
										>
											<Trash2 className="h-3 w-3" />
										</button>
									</button>
								))}
							</div>
						))
					)
				) : filteredAgents.length === 0 ? (
					<div className="p-4 text-center text-sm text-muted-foreground">Aucun agent trouvé</div>
				) : (
					filteredAgents.map((agent) => (
						<button
							type="button"
							key={agent.id}
							onClick={() => onSelectAgent(agent)}
							className={`flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-accent ${
								selectedAgentId === agent.id ? "bg-accent" : ""
							}`}
						>
							<Bot className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
							<div className="min-w-0 flex-1">
								<div className="truncate text-sm font-medium">{agent.name}</div>
								<div className="truncate text-xs text-muted-foreground">{agent.description}</div>
							</div>
						</button>
					))
				)}
			</div>

			{/* User footer */}
			<div className="flex items-center justify-between border-t px-3 py-2">
				<span className="truncate text-xs text-muted-foreground">{userName ?? "Utilisateur"}</span>
				<button
					type="button"
					onClick={onSignOut}
					className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
					title="Se déconnecter"
				>
					<LogOut className="h-3.5 w-3.5" />
				</button>
			</div>
		</div>
	);
}
