"use client";

import type { Agent } from "@claake/shared";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/lib/hooks/use-auth";

export default function ChatHomePage() {
	const router = useRouter();
	const { loading: authLoading } = useAuth();
	const [agents, setAgents] = useState<Agent[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");

	useEffect(() => {
		apiClient.agents
			.list({ limit: 50 })
			.then((res) => setAgents(res.agents))
			.catch(() => {})
			.finally(() => setLoading(false));
	}, []);

	const filtered = agents.filter(
		(a) =>
			a.name.toLowerCase().includes(search.toLowerCase()) ||
			a.description?.toLowerCase().includes(search.toLowerCase()),
	);

	if (authLoading || loading) {
		return (
			<div className="flex flex-1 items-center justify-center" style={{ background: "#faf9f5" }}>
				<span style={{ fontFamily: "'DM Sans', system-ui", fontSize: "0.85rem", color: "#a09a8a" }}>
					Chargement…
				</span>
			</div>
		);
	}

	return (
		<div
			className="flex flex-1 flex-col items-center justify-center px-6"
			style={{ background: "#faf9f5" }}
		>
			{/* Logo / titre */}
			<div className="mb-10 text-center">
				<h1
					style={{
						fontFamily: "'DM Serif Display', serif",
						fontSize: "clamp(1.8rem, 4vw, 3rem)",
						fontWeight: 400,
						color: "#1e1c18",
						lineHeight: 1.2,
					}}
				>
					Choisissez un agent
				</h1>
				<p
					style={{
						fontFamily: "'DM Sans', system-ui",
						fontSize: "0.875rem",
						color: "#a09a8a",
						marginTop: "0.5rem",
					}}
				>
					Sélectionnez l'intelligence avec laquelle vous souhaitez discuter
				</p>
			</div>

			{/* Search */}
			<div className="w-full max-w-xl mb-8">
				<input
					type="text"
					placeholder="Rechercher un agent…"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="w-full px-4 py-3 outline-none"
					style={{
						background: "#f3f0e8",
						border: "1px solid #e8e4d8",
						borderRadius: "12px",
						fontFamily: "'DM Sans', system-ui",
						fontSize: "0.875rem",
						color: "#1e1c18",
					}}
					onFocus={(e) => (e.target.style.borderColor = "#6b7c5c")}
					onBlur={(e) => (e.target.style.borderColor = "#e8e4d8")}
				/>
			</div>

			{/* Agent grid */}
			<div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
				{filtered.map((agent) => (
					<button
						key={agent.id}
						type="button"
						onClick={() => router.push(`/chat/${agent.id}`)}
						className="flex items-start gap-3 p-4 text-left transition-colors"
						style={{
							background: "#f3f0e8",
							border: "1px solid #e8e4d8",
							borderRadius: "0",
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.borderColor = "#6b7c5c";
							e.currentTarget.style.background = "#e8ede0";
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.borderColor = "#e8e4d8";
							e.currentTarget.style.background = "#f3f0e8";
						}}
					>
						{agent.image_url ? (
							<Image
								src={agent.image_url}
								alt={agent.name}
								width={36}
								height={36}
								unoptimized
								className="h-9 w-9 shrink-0 object-cover"
								style={{ borderRadius: "4px" }}
							/>
						) : (
							<div
								className="h-9 w-9 shrink-0 flex items-center justify-center"
								style={{
									background: "#e8ede0",
									border: "1px solid #d0dac4",
									fontFamily: "'DM Serif Display', serif",
									fontSize: "1rem",
									color: "#6b7c5c",
								}}
							>
								{agent.name[0].toUpperCase()}
							</div>
						)}
						<div className="flex-1 min-w-0">
							<p
								style={{
									fontFamily: "'DM Sans', system-ui",
									fontSize: "0.85rem",
									fontWeight: 500,
									color: "#1e1c18",
								}}
							>
								{agent.name}
							</p>
							{agent.description && (
								<p
									className="line-clamp-2"
									style={{
										fontFamily: "'DM Sans', system-ui",
										fontSize: "0.75rem",
										color: "#a09a8a",
										marginTop: "0.2rem",
										lineHeight: "1.5",
									}}
								>
									{agent.description}
								</p>
							)}
						</div>
					</button>
				))}

				{filtered.length === 0 && (
					<div className="col-span-3 text-center py-12">
						<p
							style={{ fontFamily: "'DM Sans', system-ui", fontSize: "0.875rem", color: "#a09a8a" }}
						>
							Aucun agent trouvé
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
