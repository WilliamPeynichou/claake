"use client";

import type { Agent, ChatSession } from "@claake/shared";
import { BookOpen, ChevronDown, ChevronRight, PenSquare, Trash2, UserCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface AppSidebarProps {
	agentId?: string;
	agents: Agent[];
	sessions: ChatSession[];
	activeSessionId: string | null;
	onSelectSession: (sessionId: string) => void;
	onNewChat: () => void;
	onDeleteSession: (sessionId: string) => void;
}

function groupByDate(sessions: ChatSession[]) {
	const groups: { label: string; items: ChatSession[] }[] = [];
	const map: Record<string, ChatSession[]> = {};
	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const yesterday = new Date(today.getTime() - 86_400_000);
	const weekAgo = new Date(today.getTime() - 7 * 86_400_000);
	for (const s of sessions) {
		const d = new Date(s.updated_at);
		const label =
			d >= today
				? "Aujourd'hui"
				: d >= yesterday
					? "Hier"
					: d >= weekAgo
						? "Cette semaine"
						: "Plus ancien";
		if (!map[label]) {
			map[label] = [];
		}
		map[label].push(s);
	}
	for (const label of ["Aujourd'hui", "Hier", "Cette semaine", "Plus ancien"]) {
		if (map[label]?.length) groups.push({ label, items: map[label] });
	}
	return groups;
}

export function AppSidebar({
	agentId,
	agents,
	sessions,
	activeSessionId,
	onSelectSession,
	onNewChat,
	onDeleteSession,
}: AppSidebarProps) {
	const router = useRouter();
	const [sessionsOpen, setSessionsOpen] = useState(true);

	const currentAgent = agents.find((a) => a.id === agentId);
	const filteredSessions = agentId ? sessions.filter((s) => s.agent_id === agentId) : sessions;
	const groups = groupByDate(filteredSessions);

	return (
		<aside
			className="flex flex-col h-full w-64 shrink-0 border-r overflow-hidden"
			style={{ background: "#f3f0e8", borderColor: "#e8e4d8" }}
		>
			{/* Header */}
			<div
				className="flex items-center justify-between px-4 py-3 shrink-0"
				style={{ borderBottom: "1px solid #e8e4d8" }}
			>
				<Link href="/chat">
					<Image
						src="/logoClaakeGreen.png"
						alt="Claake"
						width={72}
						height={22}
						style={{ height: "auto" }}
					/>
				</Link>
				<button
					type="button"
					onClick={onNewChat}
					title="Nouvelle conversation"
					className="p-1.5 rounded transition-colors"
					style={{ color: "#a09a8a" }}
					onMouseEnter={(e) => (e.currentTarget.style.color = "#6b7c5c")}
					onMouseLeave={(e) => (e.currentTarget.style.color = "#a09a8a")}
				>
					<PenSquare className="h-4 w-4" />
				</button>
			</div>

			{/* Scrollable content */}
			<div className="flex-1 overflow-y-auto flex flex-col">
				{/* ── Section Agents ── */}
				<div className="shrink-0">
					<p
						className="px-4 pt-4 pb-2"
						style={{
							fontSize: "0.62rem",
							fontWeight: 600,
							letterSpacing: "0.1em",
							textTransform: "uppercase",
							color: "#a09a8a",
							fontFamily: "'DM Sans', system-ui",
						}}
					>
						Agents
					</p>
					<div className="flex flex-col gap-0.5 px-2">
						{agents.map((agent) => {
							const isActive = agent.id === agentId;
							return (
								<button
									key={agent.id}
									type="button"
									onClick={() => router.push(`/chat/${agent.id}`)}
									className="flex items-center gap-2.5 w-full text-left px-2 py-2 transition-colors"
									style={{
										background: isActive ? "#e8ede0" : "transparent",
										borderLeft: `2px solid ${isActive ? "#6b7c5c" : "transparent"}`,
										borderRadius: "0",
									}}
									onMouseEnter={(e) => {
										if (!isActive) e.currentTarget.style.background = "#ece9e0";
									}}
									onMouseLeave={(e) => {
										if (!isActive) e.currentTarget.style.background = "transparent";
									}}
								>
									{agent.image_url ? (
										<Image
											src={agent.image_url}
											alt={agent.name}
											width={24}
											height={24}
											unoptimized
											className="h-6 w-6 shrink-0 object-cover"
											style={{ borderRadius: "3px" }}
										/>
									) : (
										<div
											className="h-6 w-6 shrink-0 flex items-center justify-center text-xs"
											style={{
												background: isActive ? "#d0dac4" : "#e8e4d8",
												color: "#6b7c5c",
												borderRadius: "3px",
												fontFamily: "'DM Serif Display', serif",
												fontSize: "0.75rem",
											}}
										>
											{agent.name[0].toUpperCase()}
										</div>
									)}
									<span
										className="truncate"
										style={{
											fontSize: "0.82rem",
											fontWeight: isActive ? 500 : 400,
											color: isActive ? "#1e1c18" : "#3a3730",
											fontFamily: "'DM Sans', system-ui",
										}}
									>
										{agent.name}
									</span>
								</button>
							);
						})}
					</div>
				</div>

				{/* Séparateur */}
				<div style={{ height: "1px", background: "#e8e4d8", margin: "0.75rem 1rem" }} />

				{/* ── Section Historique ── */}
				<div className="flex-1">
					<button
						type="button"
						onClick={() => setSessionsOpen((v) => !v)}
						className="flex items-center justify-between w-full px-4 pb-2"
					>
						<p
							style={{
								fontSize: "0.62rem",
								fontWeight: 600,
								letterSpacing: "0.1em",
								textTransform: "uppercase",
								color: "#a09a8a",
								fontFamily: "'DM Sans', system-ui",
							}}
						>
							{currentAgent ? `Conversations — ${currentAgent.name}` : "Conversations"}
						</p>
						{sessionsOpen ? (
							<ChevronDown className="h-3 w-3" style={{ color: "#a09a8a" }} />
						) : (
							<ChevronRight className="h-3 w-3" style={{ color: "#a09a8a" }} />
						)}
					</button>

					{sessionsOpen && (
						<div className="flex flex-col">
							{filteredSessions.length === 0 ? (
								<p
									className="px-4 py-3 text-center"
									style={{
										fontSize: "0.75rem",
										color: "#a09a8a",
										fontFamily: "'DM Sans', system-ui",
									}}
								>
									Aucune conversation
								</p>
							) : (
								groups.map(({ label, items }) => (
									<div key={label} className="mb-3">
										<p
											className="px-4 pb-1"
											style={{
												fontSize: "0.6rem",
												letterSpacing: "0.08em",
												textTransform: "uppercase",
												color: "#a09a8a",
												fontFamily: "'DM Sans', system-ui",
											}}
										>
											{label}
										</p>
										{items.map((session) => {
											const isActive = session.id === activeSessionId;
											return (
												<div
													key={session.id}
													className={`group flex items-center mx-2 px-2 py-1.5 ${
														isActive ? "bg-[#e8ede0]" : "hover:bg-[#ece9e0]"
													}`}
													style={{
														borderLeft: `2px solid ${isActive ? "#6b7c5c" : "transparent"}`,
													}}
												>
													<button
														type="button"
														className="flex-1 min-w-0 text-left"
														onClick={() => onSelectSession(session.id)}
													>
														<p
															className="truncate"
															style={{
																fontSize: "0.78rem",
																color: isActive ? "#1e1c18" : "#3a3730",
																fontWeight: isActive ? 500 : 400,
																fontFamily: "'DM Sans', system-ui",
															}}
														>
															{session.title ?? session.agent_name ?? "Conversation"}
														</p>
													</button>
													<button
														type="button"
														onClick={(e) => {
															e.stopPropagation();
															onDeleteSession(session.id);
														}}
														className="ml-1 shrink-0 opacity-0 group-hover:opacity-100 p-1"
														style={{ color: "#a09a8a" }}
														onMouseEnter={(e) => (e.currentTarget.style.color = "#c44444")}
														onMouseLeave={(e) => (e.currentTarget.style.color = "#a09a8a")}
													>
														<Trash2 className="h-3 w-3" />
													</button>
												</div>
											);
										})}
									</div>
								))
							)}
						</div>
					)}
				</div>
			</div>

			{/* Footer */}
			<div
				className="shrink-0 flex flex-col gap-0.5 px-2 py-3"
				style={{ borderTop: "1px solid #e8e4d8" }}
			>
				<Link
					href="/catalogue"
					className="flex items-center gap-2 px-2 py-1.5 transition-colors"
					style={{
						fontSize: "0.78rem",
						color: "#6b6558",
						fontFamily: "'DM Sans', system-ui",
						textDecoration: "none",
					}}
					onMouseEnter={(e) => {
						e.currentTarget.style.color = "#6b7c5c";
						e.currentTarget.style.background = "#e8ede0";
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.color = "#6b6558";
						e.currentTarget.style.background = "transparent";
					}}
				>
					<BookOpen className="h-3.5 w-3.5 shrink-0" />
					Catalogue d'agents
				</Link>
				<Link
					href="/dashboard/settings"
					className="flex items-center gap-2 px-2 py-1.5 transition-colors"
					style={{
						fontSize: "0.78rem",
						color: "#6b6558",
						fontFamily: "'DM Sans', system-ui",
						textDecoration: "none",
					}}
					onMouseEnter={(e) => {
						e.currentTarget.style.color = "#6b7c5c";
						e.currentTarget.style.background = "#e8ede0";
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.color = "#6b6558";
						e.currentTarget.style.background = "transparent";
					}}
				>
					<UserCircle className="h-3.5 w-3.5 shrink-0" />
					Mon profil
				</Link>
			</div>
		</aside>
	);
}
