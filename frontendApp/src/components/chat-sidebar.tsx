import type { ChatSession } from "@claake/shared";
import { ChevronLeft, ChevronRight, LogOut, MessageSquare, PenSquare, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

interface ChatSidebarProps {
	sessions: ChatSession[];
	activeSessionId: string | null;
	onSelectSession: (session: ChatSession) => void;
	onDeleteSession: (sessionId: string) => void;
	onNewChat: () => void;
	onSignOut: () => void;
	userName: string | null;
}

export function ChatSidebar({
	sessions,
	activeSessionId,
	onSelectSession,
	onDeleteSession,
	onNewChat,
	onSignOut,
	userName,
}: ChatSidebarProps) {
	const [collapsed, setCollapsed] = useState(false);

	const groupedSessions = useMemo(() => {
		const now = new Date();
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const yesterday = new Date(today.getTime() - 86400000);
		const weekAgo = new Date(today.getTime() - 7 * 86400000);
		const monthAgo = new Date(today.getTime() - 30 * 86400000);

		const groups: { label: string; sessions: ChatSession[] }[] = [
			{ label: "Today", sessions: [] },
			{ label: "Yesterday", sessions: [] },
			{ label: "Previous 7 days", sessions: [] },
			{ label: "Previous 30 days", sessions: [] },
			{ label: "Older", sessions: [] },
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

	/* ── Collapsed ── */
	if (collapsed) {
		return (
			<aside
				className="flex h-full flex-col border-r"
				style={{ width: 56, background: "#f3f0e8", borderColor: "#e8e4d8", transition: "width 200ms ease" }}
			>
				{/* Expand */}
				<div className="flex justify-center px-3 pt-5 pb-2">
					<button
						type="button"
						onClick={() => setCollapsed(false)}
						className="flex h-9 w-9 items-center justify-center transition-colors"
						style={{ color: "#766f62" }}
						aria-label="Expand sidebar"
						onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#1e1c18"; }}
						onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#766f62"; }}
					>
						<ChevronRight className="h-4 w-4" />
					</button>
				</div>

				{/* New chat */}
				<div className="flex justify-center px-3 pb-4">
					<button
						type="button"
						onClick={onNewChat}
						className="flex h-9 w-9 items-center justify-center transition-colors"
						style={{ color: "#2a7a44" }}
						aria-label="New chat"
						onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#e8f2ec"; }}
						onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
					>
						<PenSquare className="h-4 w-4" />
					</button>
				</div>

				{/* Sessions icons */}
				<div className="flex flex-1 flex-col items-center gap-1 overflow-y-auto px-3 py-2">
					{sessions.slice(0, 12).map((s) => (
						<button
							key={s.id}
							type="button"
							onClick={() => onSelectSession(s)}
							className="flex h-9 w-9 items-center justify-center transition-colors"
							style={{ color: activeSessionId === s.id ? "#2a7a44" : "#766f62" }}
							aria-label={s.title ?? s.agent_name}
							aria-current={activeSessionId === s.id ? "true" : undefined}
							onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#e8e4d8"; }}
							onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
						>
							<MessageSquare className="h-4 w-4" />
						</button>
					))}
				</div>

				{/* Sign out */}
				<div className="flex justify-center border-t px-3 py-4" style={{ borderColor: "#e8e4d8" }}>
					<button
						type="button"
						onClick={onSignOut}
						className="flex h-9 w-9 items-center justify-center transition-colors"
						style={{ color: "#766f62" }}
						aria-label="Sign out"
						onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#c0392b"; }}
						onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#766f62"; }}
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
			style={{ width: 280, background: "#f3f0e8", borderColor: "#e8e4d8", transition: "width 200ms ease" }}
		>
			{/* Header — logo + collapse */}
			<div className="flex items-center justify-between px-5 py-5">
				<img src="/logo.png" alt="Claake" style={{ height: 30 }} />
				<button
					type="button"
					onClick={() => setCollapsed(true)}
					className="flex h-8 w-8 items-center justify-center transition-colors"
					style={{ color: "#766f62" }}
					aria-label="Collapse sidebar"
					onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#1e1c18"; }}
					onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#766f62"; }}
				>
					<ChevronLeft className="h-4 w-4" />
				</button>
			</div>

			{/* New chat — bouton plein largeur */}
			<div className="px-3 pb-4">
				<button
					type="button"
					onClick={onNewChat}
					className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium transition-all"
					style={{ color: "#1e1c18", background: "transparent" }}
					aria-label="New chat"
					onMouseEnter={(e) => {
						(e.currentTarget as HTMLButtonElement).style.background = "#e8e4d8";
					}}
					onMouseLeave={(e) => {
						(e.currentTarget as HTMLButtonElement).style.background = "transparent";
					}}
				>
					<PenSquare className="h-4 w-4 shrink-0" style={{ color: "#2a7a44" }} />
					New chat
				</button>
			</div>

			{/* Conversations */}
			<div className="flex-1 overflow-y-auto">
				{groupedSessions.length === 0 ? (
					<div className="flex flex-col items-center justify-center gap-3 px-5 py-16 text-center">
						<MessageSquare className="h-8 w-8 opacity-20" style={{ color: "#6b6558" }} />
						<p className="text-sm" style={{ color: "#766f62" }}>No conversations yet</p>
					</div>
				) : (
					groupedSessions.map((group) => (
						<div key={group.label} className="mb-2">
							{/* Group label */}
							<p
								className="px-5 pb-1 pt-4 text-xs font-medium"
								style={{ color: "#766f62" }}
							>
								{group.label}
							</p>

							{/* Session rows */}
							{group.sessions.map((session) => (
								<button
									type="button"
									key={session.id}
									onClick={() => onSelectSession(session)}
									aria-current={activeSessionId === session.id ? "true" : undefined}
									className="group relative flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors"
									style={
										activeSessionId === session.id
											? { background: "#e8e4d8" }
											: {}
									}
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
										onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
										className="shrink-0 p-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
										style={{ color: "#766f62" }}
										aria-label={`Delete conversation ${session.title ?? session.agent_name}`}
										onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#c0392b"; }}
										onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#766f62"; }}
									>
										<Trash2 className="h-3.5 w-3.5" />
									</button>
								</button>
							))}
						</div>
					))
				)}
			</div>

			{/* Footer — user */}
			<div
				className="border-t px-3 py-3"
				style={{ borderColor: "#e8e4d8" }}
			>
				<div className="flex items-center gap-3 px-2 py-2">
					{/* Avatar initiales */}
					<div
						className="flex h-8 w-8 shrink-0 items-center justify-center text-xs font-medium"
						style={{ background: "#2a7a44", color: "#faf9f5" }}
					>
						{(userName ?? "U").slice(0, 1).toUpperCase()}
					</div>
					<span className="min-w-0 flex-1 truncate text-sm font-medium" style={{ color: "#1e1c18" }}>
						{userName ?? "User"}
					</span>
					<button
						type="button"
						onClick={onSignOut}
						className="shrink-0 p-1.5 transition-colors"
						style={{ color: "#766f62" }}
						aria-label="Sign out"
						onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#c0392b"; }}
						onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#766f62"; }}
					>
						<LogOut className="h-4 w-4" />
					</button>
				</div>
			</div>
		</aside>
	);
}
