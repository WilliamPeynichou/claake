import type { Agent, ChatSession } from "@claake/shared";
import {
	Bot,
	ChevronLeft,
	ChevronRight,
	LogOut,
	MessageSquare,
	PenSquare,
	Search,
	Settings,
	Trash2,
	X,
} from "lucide-react";
import { useMemo, useState } from "react";

interface ChatSidebarProps {
	agents: Agent[];
	sessions: ChatSession[];
	activeSessionId: string | null;
	onSelectSession: (session: { id: string; agent_id: string; agent_name: string }) => void;
	onDeleteSession: (sessionId: string) => void;
	onNewChat: (agent: Agent) => void;
	onOpenSettings: () => void;
	onSignOut: () => void;
	userName: string | null;
}

export function ChatSidebar({
	agents,
	sessions,
	activeSessionId,
	onSelectSession,
	onDeleteSession,
	onNewChat,
	onOpenSettings,
	onSignOut,
	userName,
}: ChatSidebarProps) {
	const [collapsed, setCollapsed] = useState(false);
	const [showAgents, setShowAgents] = useState(false);
	const [search, setSearch] = useState("");

	const filteredAgents = agents.filter(
		(a) =>
			a.name.toLowerCase().includes(search.toLowerCase()) ||
			(a.description ?? "").toLowerCase().includes(search.toLowerCase()),
	);

	const groupedSessions = useMemo(() => {
		const now = new Date();
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const yesterday = new Date(today.getTime() - 86400000);
		const weekAgo = new Date(today.getTime() - 7 * 86400000);
		const monthAgo = new Date(today.getTime() - 30 * 86400000);

		const groups: { label: string; sessions: ChatSession[] }[] = [
			{ label: "Aujourd'hui", sessions: [] },
			{ label: "Hier", sessions: [] },
			{ label: "Cette semaine", sessions: [] },
			{ label: "Ce mois", sessions: [] },
			{ label: "Plus ancien", sessions: [] },
		];

		for (const s of sessions) {
			const d = new Date(s.updated_at);
			if (d >= today) groups[0].sessions.push(s);
			else if (d >= yesterday) groups[1].sessions.push(s);
			else if (d >= weekAgo) groups[2].sessions.push(s);
			else if (d >= monthAgo) groups[3].sessions.push(s);
			else groups[4].sessions.push(s);
		}

		return groups.filter((g) => g.sessions.length > 0);
	}, [sessions]);

	function handleSelectAgent(agent: Agent) {
		onNewChat(agent);
		setShowAgents(false);
		setSearch("");
	}

	/* ── Collapsed ── */
	if (collapsed) {
		return (
			<aside
				className="flex h-full flex-col border-r"
				style={{ width: 56, background: "#f3f0e8", borderColor: "#e8e4d8" }}
			>
				<div className="flex justify-center px-3 pt-5 pb-2">
					<button
						type="button"
						onClick={() => setCollapsed(false)}
						className="flex h-9 w-9 items-center justify-center"
						style={{ color: "#766f62" }}
						aria-label="Expand sidebar"
					>
						<ChevronRight className="h-4 w-4" />
					</button>
				</div>
				<div className="flex justify-center px-3 pb-4">
					<button
						type="button"
						onClick={() => {
							setCollapsed(false);
							setShowAgents(true);
						}}
						className="flex h-9 w-9 items-center justify-center"
						style={{ color: "#2a7a44" }}
						aria-label="New chat"
					>
						<PenSquare className="h-4 w-4" />
					</button>
				</div>
				<div className="flex flex-1 flex-col items-center gap-1 overflow-y-auto px-3 py-2">
					{sessions.slice(0, 12).map((s) => (
						<button
							key={s.id}
							type="button"
							onClick={() => onSelectSession(s)}
							className="flex h-9 w-9 items-center justify-center"
							style={{ color: activeSessionId === s.id ? "#2a7a44" : "#766f62" }}
							aria-label={s.title ?? s.agent_name}
						>
							<MessageSquare className="h-4 w-4" />
						</button>
					))}
				</div>
				<div className="flex justify-center border-t px-3 py-3" style={{ borderColor: "#e8e4d8" }}>
					<button
						type="button"
						onClick={onOpenSettings}
						className="flex h-9 w-9 items-center justify-center"
						style={{ color: "#766f62" }}
						aria-label="Settings"
					>
						<Settings className="h-4 w-4" />
					</button>
				</div>
				<div className="flex justify-center border-t px-3 py-4" style={{ borderColor: "#e8e4d8" }}>
					<button
						type="button"
						onClick={onSignOut}
						className="flex h-9 w-9 items-center justify-center"
						style={{ color: "#766f62" }}
						aria-label="Sign out"
					>
						<LogOut className="h-4 w-4" />
					</button>
				</div>
			</aside>
		);
	}

	/* ── Expanded ── */
	return (
		<aside
			className="flex h-full flex-col border-r"
			style={{ width: 280, background: "#f3f0e8", borderColor: "#e8e4d8" }}
		>
			{/* Header */}
			<div className="flex items-center justify-between px-5 py-5">
				<img src="/logo.png" alt="Claake" style={{ height: 30 }} />
				<button
					type="button"
					onClick={() => setCollapsed(true)}
					className="flex h-8 w-8 items-center justify-center"
					style={{ color: "#766f62" }}
					aria-label="Collapse sidebar"
				>
					<ChevronLeft className="h-4 w-4" />
				</button>
			</div>

			{/* New chat button */}
			<div className="px-3 pb-3">
				<button
					type="button"
					onClick={() => setShowAgents(!showAgents)}
					className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium transition-colors"
					style={{ color: "#1e1c18", background: showAgents ? "#e8e4d8" : "transparent" }}
					onMouseEnter={(e) => {
						(e.currentTarget as HTMLButtonElement).style.background = "#e8e4d8";
					}}
					onMouseLeave={(e) => {
						if (!showAgents)
							(e.currentTarget as HTMLButtonElement).style.background = "transparent";
					}}
				>
					<PenSquare className="h-4 w-4 shrink-0" style={{ color: "#2a7a44" }} />
					Nouveau chat
				</button>
			</div>

			{/* Agent selector panel */}
			{showAgents && (
				<div className="border-t border-b px-3 pb-3" style={{ borderColor: "#e8e4d8" }}>
					<div className="flex items-center gap-2 pt-3 pb-2">
						<Search className="h-3.5 w-3.5 shrink-0" style={{ color: "#a09a8a" }} />
						<input
							type="text"
							placeholder="Rechercher un agent…"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="flex-1 bg-transparent text-sm outline-none"
							style={{ color: "#1e1c18" }}
						/>
						{search && (
							<button type="button" onClick={() => setSearch("")}>
								<X className="h-3.5 w-3.5" style={{ color: "#a09a8a" }} />
							</button>
						)}
					</div>
					<div className="max-h-52 overflow-y-auto">
						{filteredAgents.length === 0 ? (
							<p className="py-3 text-center text-xs" style={{ color: "#a09a8a" }}>
								Aucun agent trouvé
							</p>
						) : (
							filteredAgents.map((agent) => (
								<button
									key={agent.id}
									type="button"
									onClick={() => handleSelectAgent(agent)}
									className="flex w-full items-center gap-2 px-2 py-2 text-left text-sm transition-colors"
									style={{ color: "#1e1c18" }}
									onMouseEnter={(e) => {
										(e.currentTarget as HTMLButtonElement).style.background = "#e8e4d8";
									}}
									onMouseLeave={(e) => {
										(e.currentTarget as HTMLButtonElement).style.background = "transparent";
									}}
								>
									<div
										className="h-6 w-6 shrink-0 flex items-center justify-center"
										style={{ background: "#e8ede0", border: "1px solid #d0dac4" }}
									>
										{agent.image_url ? (
											<img
												src={agent.image_url}
												alt={agent.name}
												className="h-full w-full object-cover"
											/>
										) : (
											<Bot className="h-3 w-3" style={{ color: "#6b7c5c" }} />
										)}
									</div>
									<div className="min-w-0 flex-1">
										<p className="truncate text-xs font-medium">{agent.name}</p>
										{agent.description && (
											<p className="truncate text-xs" style={{ color: "#a09a8a" }}>
												{agent.description}
											</p>
										)}
									</div>
								</button>
							))
						)}
					</div>
				</div>
			)}

			{/* Conversations */}
			<div className="flex-1 overflow-y-auto">
				{groupedSessions.length === 0 ? (
					<div className="flex flex-col items-center justify-center gap-3 px-5 py-16 text-center">
						<MessageSquare className="h-8 w-8 opacity-20" style={{ color: "#6b6558" }} />
						<p className="text-sm" style={{ color: "#766f62" }}>
							Aucune conversation
						</p>
					</div>
				) : (
					groupedSessions.map((group) => (
						<div key={group.label} className="mb-2">
							<p className="px-5 pb-1 pt-4 text-xs font-medium" style={{ color: "#766f62" }}>
								{group.label}
							</p>
							{group.sessions.map((session) => (
								<button
									key={session.id}
									type="button"
									onClick={() => onSelectSession(session)}
									aria-current={activeSessionId === session.id ? "true" : undefined}
									className="group relative flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors"
									style={{ background: activeSessionId === session.id ? "#e8e4d8" : "transparent" }}
									onMouseEnter={(e) => {
										if (activeSessionId !== session.id)
											(e.currentTarget as HTMLButtonElement).style.background = "#ebe8e0";
									}}
									onMouseLeave={(e) => {
										if (activeSessionId !== session.id)
											(e.currentTarget as HTMLButtonElement).style.background = "transparent";
									}}
								>
									<span className="min-w-0 flex-1 truncate text-sm" style={{ color: "#1e1c18" }}>
										{session.title ?? session.agent_name}
									</span>
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation();
											onDeleteSession(session.id);
										}}
										className="shrink-0 p-1 opacity-0 transition-opacity group-hover:opacity-100"
										style={{ color: "#766f62" }}
										aria-label={`Supprimer ${session.title ?? session.agent_name}`}
										onMouseEnter={(e) => {
											(e.currentTarget as HTMLButtonElement).style.color = "#c0392b";
										}}
										onMouseLeave={(e) => {
											(e.currentTarget as HTMLButtonElement).style.color = "#766f62";
										}}
									>
										<Trash2 className="h-3.5 w-3.5" />
									</button>
								</button>
							))}
						</div>
					))
				)}
			</div>

			{/* Footer */}
			<div className="border-t px-3 py-3" style={{ borderColor: "#e8e4d8" }}>
				<div className="mb-2 px-3">
					<button
						type="button"
						onClick={onOpenSettings}
						className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium transition-colors"
						style={{ color: "#1e1c18", background: "transparent" }}
						onMouseEnter={(e) => {
							(e.currentTarget as HTMLButtonElement).style.background = "#e8e4d8";
						}}
						onMouseLeave={(e) => {
							(e.currentTarget as HTMLButtonElement).style.background = "transparent";
						}}
					>
						<Settings className="h-4 w-4 shrink-0" style={{ color: "#766f62" }} />
						Clés API
					</button>
				</div>
				<div className="flex items-center gap-3 px-2 py-2">
					<div
						className="flex h-8 w-8 shrink-0 items-center justify-center text-xs font-medium"
						style={{ background: "#2a7a44", color: "#faf9f5" }}
					>
						{(userName ?? "U").slice(0, 1).toUpperCase()}
					</div>
					<span
						className="min-w-0 flex-1 truncate text-sm font-medium"
						style={{ color: "#1e1c18" }}
					>
						{userName ?? "User"}
					</span>
					<button
						type="button"
						onClick={onSignOut}
						className="shrink-0 p-1.5 transition-colors"
						style={{ color: "#766f62" }}
						aria-label="Sign out"
						onMouseEnter={(e) => {
							(e.currentTarget as HTMLButtonElement).style.color = "#c0392b";
						}}
						onMouseLeave={(e) => {
							(e.currentTarget as HTMLButtonElement).style.color = "#766f62";
						}}
					>
						<LogOut className="h-4 w-4" />
					</button>
				</div>
			</div>
		</aside>
	);
}
