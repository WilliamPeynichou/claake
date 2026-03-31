"use client";

import type { Agent } from "@claake/shared";
import { ChevronDown, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface AgentSelectorProps {
	currentAgent: Agent | null;
	agents: Agent[];
}

export function AgentSelector({ currentAgent, agents }: AgentSelectorProps) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");
	const panelRef = useRef<HTMLDivElement>(null);

	const filtered = agents.filter(
		(a) =>
			a.name.toLowerCase().includes(search.toLowerCase()) ||
			a.description?.toLowerCase().includes(search.toLowerCase()),
	);

	// Close on outside click
	useEffect(() => {
		function handler(e: MouseEvent) {
			if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
				setOpen(false);
				setSearch("");
			}
		}
		if (open) document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, [open]);

	function select(agent: Agent) {
		setOpen(false);
		setSearch("");
		router.push(`/chat/${agent.id}`);
	}

	return (
		<div className="relative" ref={panelRef}>
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				className="flex items-center gap-1.5 px-2.5 py-1.5 transition-colors"
				style={{
					background: open ? "#e8ede0" : "transparent",
					border: "1px solid",
					borderColor: open ? "#d0dac4" : "#e8e4d8",
					color: "#3a3730",
					fontFamily: "'DM Sans', system-ui",
					fontSize: "0.78rem",
					fontWeight: 500,
					borderRadius: "6px",
				}}
				onMouseEnter={(e) => { if (!open) e.currentTarget.style.borderColor = "#d0dac4"; }}
				onMouseLeave={(e) => { if (!open) e.currentTarget.style.borderColor = "#e8e4d8"; }}
			>
				<span className="truncate max-w-[140px]">
					{currentAgent?.name ?? "Choisir un agent"}
				</span>
				<ChevronDown
					className="h-3 w-3 shrink-0 transition-transform"
					style={{
						color: "#a09a8a",
						transform: open ? "rotate(180deg)" : "rotate(0deg)",
					}}
				/>
			</button>

			{open && (
				<div
					className="absolute bottom-full mb-2 left-0 w-72 shadow-lg"
					style={{
						background: "#faf9f5",
						border: "1px solid #e8e4d8",
						borderRadius: "8px",
						overflow: "hidden",
						zIndex: 50,
					}}
				>
					{/* Search */}
					<div
						className="flex items-center gap-2 px-3 py-2"
						style={{ borderBottom: "1px solid #e8e4d8" }}
					>
						<Search className="h-3.5 w-3.5 shrink-0" style={{ color: "#a09a8a" }} />
						<input
							autoFocus
							type="text"
							placeholder="Rechercher un agent..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="flex-1 bg-transparent outline-none"
							style={{
								fontFamily: "'DM Sans', system-ui",
								fontSize: "0.8rem",
								color: "#1e1c18",
							}}
						/>
						{search && (
							<button type="button" onClick={() => setSearch("")}>
								<X className="h-3 w-3" style={{ color: "#a09a8a" }} />
							</button>
						)}
					</div>

					{/* List */}
					<div className="max-h-64 overflow-y-auto py-1">
						{filtered.length === 0 ? (
							<p
								className="px-4 py-3 text-center"
								style={{ fontSize: "0.75rem", color: "#a09a8a", fontFamily: "'DM Sans', system-ui" }}
							>
								Aucun agent trouvé
							</p>
						) : (
							filtered.map((agent) => {
								const isActive = agent.id === currentAgent?.id;
								return (
									<button
										key={agent.id}
										type="button"
										onClick={() => select(agent)}
										className="flex items-start gap-3 w-full px-3 py-2.5 text-left transition-colors"
										style={{
											background: isActive ? "#e8ede0" : "transparent",
											borderLeft: isActive ? "2px solid #6b7c5c" : "2px solid transparent",
										}}
										onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "#f3f0e8"; }}
										onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
									>
										<div
											className="h-6 w-6 shrink-0 flex items-center justify-center text-xs"
											style={{
												background: isActive ? "#d0dac4" : "#e8e4d8",
												color: "#6b7c5c",
												borderRadius: "4px",
												fontFamily: "'DM Serif Display', serif",
											}}
										>
											{agent.name[0].toUpperCase()}
										</div>
										<div className="flex-1 min-w-0">
											<p
												style={{
													fontSize: "0.8rem",
													fontWeight: isActive ? 500 : 400,
													color: "#1e1c18",
													fontFamily: "'DM Sans', system-ui",
												}}
											>
												{agent.name}
											</p>
											{agent.description && (
												<p
													className="truncate"
													style={{ fontSize: "0.7rem", color: "#a09a8a", fontFamily: "'DM Sans', system-ui" }}
												>
													{agent.description}
												</p>
											)}
										</div>
									</button>
								);
							})
						)}
					</div>
				</div>
			)}
		</div>
	);
}
