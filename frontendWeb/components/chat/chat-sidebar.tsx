"use client";

import type { Agent, ChatSession } from "@claake/shared";
import { Bot, MessageSquare, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

interface ChatSidebarProps {
	agents: Agent[];
	sessions: ChatSession[];
	activeSessionId: string | null;
	onSelectAgent: (agent: Agent) => void;
	onSelectSession: (sessionId: string) => void;
	onNewChat: (agent: Agent) => void;
	onDeleteSession: (sessionId: string) => void;
}

function groupSessionsByDate(sessions: ChatSession[]) {
	const groups: Record<string, ChatSession[]> = {};
	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const yesterday = new Date(today.getTime() - 86400000);
	const weekAgo = new Date(today.getTime() - 7 * 86400000);

	for (const session of sessions) {
		const date = new Date(session.updated_at);
		let label: string;
		if (date >= today) {
			label = "Aujourd'hui";
		} else if (date >= yesterday) {
			label = "Hier";
		} else if (date >= weekAgo) {
			label = "Cette semaine";
		} else {
			label = "Plus ancien";
		}
		if (!groups[label]) groups[label] = [];
		groups[label].push(session);
	}

	return groups;
}

export function ChatSidebar({
	agents,
	sessions,
	activeSessionId,
	onSelectAgent,
	onSelectSession,
	onNewChat,
	onDeleteSession,
}: ChatSidebarProps) {
	const [search, setSearch] = useState("");
	const [showAgents, setShowAgents] = useState(false);

	const filteredAgents = agents.filter(
		(a) =>
			a.name.toLowerCase().includes(search.toLowerCase()) ||
			a.description.toLowerCase().includes(search.toLowerCase()),
	);

	const grouped = groupSessionsByDate(sessions);
	const groupOrder = ["Aujourd'hui", "Hier", "Cette semaine", "Plus ancien"];

	return (
		<aside className="flex w-72 flex-col border-r bg-muted/40">
			{/* Header */}
			<div className="flex items-center justify-between p-4">
				<h2 className="text-sm font-semibold">Chat</h2>
				<Button
					variant="ghost"
					size="sm"
					onClick={() => setShowAgents(!showAgents)}
					title="Nouvelle conversation"
				>
					<Plus className="h-4 w-4" />
				</Button>
			</div>

			{/* Agent selector */}
			{showAgents && (
				<div className="border-b px-4 pb-3">
					<Input
						placeholder="Rechercher un agent..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="mb-2 text-sm"
					/>
					<div className="max-h-48 overflow-y-auto">
						{filteredAgents.map((agent) => (
							<button
								type="button"
								key={agent.id}
								onClick={() => {
									onNewChat(agent);
									setShowAgents(false);
									setSearch("");
								}}
								className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
							>
								<Bot className="h-4 w-4 shrink-0 text-muted-foreground" />
								<span className="truncate">{agent.name}</span>
							</button>
						))}
						{filteredAgents.length === 0 && (
							<p className="py-2 text-center text-xs text-muted-foreground">
								Aucun agent trouvé
							</p>
						)}
					</div>
				</div>
			)}

			<Separator />

			{/* Conversations list */}
			<div className="flex-1 overflow-y-auto px-2 py-2">
				{sessions.length === 0 ? (
					<p className="px-2 py-4 text-center text-xs text-muted-foreground">
						Aucune conversation
					</p>
				) : (
					groupOrder.map((label) => {
						const group = grouped[label];
						if (!group?.length) return null;
						return (
							<div key={label} className="mb-3">
								<p className="mb-1 px-2 text-xs font-medium text-muted-foreground">
									{label}
								</p>
								{group.map((session) => (
									<div
										key={session.id}
										className={`group flex items-center gap-1 rounded-md px-2 py-1.5 text-sm ${
											session.id === activeSessionId
												? "bg-accent font-medium"
												: "hover:bg-accent/50"
										}`}
									>
										<button
											type="button"
											onClick={() => onSelectSession(session.id)}
											className="flex min-w-0 flex-1 items-center gap-2 text-left"
										>
											<MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
											<div className="min-w-0 flex-1">
												<p className="truncate">
													{session.title ?? session.agent_name}
												</p>
												{session.last_message_preview && (
													<p className="truncate text-xs text-muted-foreground">
														{session.last_message_preview}
													</p>
												)}
											</div>
										</button>
										<button
											type="button"
											onClick={(e) => {
												e.stopPropagation();
												onDeleteSession(session.id);
											}}
											className="shrink-0 opacity-0 group-hover:opacity-100"
											title="Supprimer"
										>
											<Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
										</button>
									</div>
								))}
							</div>
						);
					})
				)}
			</div>
		</aside>
	);
}
