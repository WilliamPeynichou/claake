"use client";

import type { McpServer } from "@claake/shared";
import { Loader2, Plus, RefreshCw, Send, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api";

export function McpManager({ agentId, token }: { agentId: string; token: string }) {
	const [servers, setServers] = useState<McpServer[]>([]);
	const [name, setName] = useState("");
	const [url, setUrl] = useState("");
	const [headerName, setHeaderName] = useState("Authorization");
	const [secret, setSecret] = useState("");
	const [busy, setBusy] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		try {
			setServers(await apiClient.agents.mcp.list(agentId, token));
		} catch (err) {
			setError(err instanceof Error ? err.message : "Chargement MCP impossible.");
		}
	}, [agentId, token]);
	useEffect(() => void load(), [load]);

	async function run(key: string, action: () => Promise<unknown>) {
		setBusy(key);
		setError(null);
		try {
			await action();
			await load();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Action MCP impossible.");
		} finally {
			setBusy(null);
		}
	}

	async function create() {
		if (!name.trim() || !url.trim()) return;
		const auth = secret
			? headerName.trim().toLowerCase() === "authorization"
				? { type: "BEARER" as const, token: secret.replace(/^Bearer\s+/i, "") }
				: { type: "API_KEY" as const, header: headerName.trim(), value: secret }
			: undefined;
		await run("create", () => apiClient.agents.mcp.create(agentId, { name, url, auth }, token));
		setName("");
		setUrl("");
		setSecret("");
	}

	return (
		<div className="space-y-4">
			<p className="text-sm text-muted-foreground">
				Connectez des serveurs MCP HTTP. Les identifiants sont chiffrés et ne sont jamais
				réaffichés.
			</p>
			{error && <p className="text-sm text-destructive">{error}</p>}
			<div className="grid gap-3 rounded-lg border p-4 md:grid-cols-2">
				<div>
					<Label htmlFor="mcp-name">Nom</Label>
					<Input id="mcp-name" value={name} onChange={(e) => setName(e.target.value)} />
				</div>
				<div>
					<Label htmlFor="mcp-url">URL HTTPS</Label>
					<Input
						id="mcp-url"
						type="url"
						placeholder="https://…"
						value={url}
						onChange={(e) => setUrl(e.target.value)}
					/>
				</div>
				<div>
					<Label htmlFor="mcp-auth">En-tête d’authentification (optionnel)</Label>
					<Input id="mcp-auth" value={headerName} onChange={(e) => setHeaderName(e.target.value)} />
				</div>
				<div>
					<Label htmlFor="mcp-secret">Valeur (optionnelle)</Label>
					<Input
						id="mcp-secret"
						type="password"
						autoComplete="new-password"
						placeholder="Bearer …"
						value={secret}
						onChange={(e) => setSecret(e.target.value)}
					/>
				</div>
				<Button onClick={create} disabled={busy !== null || !name.trim() || !url.trim()}>
					<Plus className="mr-2 h-4 w-4" />
					Ajouter
				</Button>
			</div>
			{servers.map((server) => (
				<Card key={server.id}>
					<CardContent className="space-y-3 p-4">
						<div className="flex flex-wrap items-center justify-between gap-2">
							<div>
								<p className="font-medium">{server.name}</p>
								<p className="break-all text-xs text-muted-foreground">{server.url}</p>
							</div>
							<Badge variant="outline">{server.review_status}</Badge>
						</div>
						{server.review_reason && (
							<p className="text-sm text-destructive">{server.review_reason}</p>
						)}
						{server.tools.length > 0 && (
							<div className="space-y-2">
								{server.tools.map((tool) => (
									<label key={tool.id} className="flex gap-2 text-sm">
										<input
											type="checkbox"
											checked={tool.selected}
											onChange={() =>
												void run(`tool:${tool.id}`, () =>
													apiClient.agents.mcp.selectTools(
														agentId,
														server.id,
														{
															tool_ids: server.tools
																.filter((item) =>
																	item.id === tool.id ? !item.selected : item.selected,
																)
																.map((item) => item.id),
														},
														token,
													),
												)
											}
										/>
										<span>
											<strong>{tool.name}</strong>
											{tool.description ? ` — ${tool.description}` : ""}
										</span>
									</label>
								))}
							</div>
						)}
						<div className="flex flex-wrap gap-2">
							<Button
								size="sm"
								variant="outline"
								disabled={busy !== null}
								onClick={() =>
									void run(`discover:${server.id}`, () =>
										apiClient.agents.mcp.discover(agentId, server.id, token),
									)
								}
							>
								<RefreshCw className="mr-1 h-4 w-4" />
								Découvrir
							</Button>
							<Button
								size="sm"
								disabled={busy !== null || !server.tools.some((t) => t.selected)}
								onClick={() =>
									void run(`submit:${server.id}`, () =>
										apiClient.agents.mcp.submit(agentId, server.id, token),
									)
								}
							>
								<Send className="mr-1 h-4 w-4" />
								Soumettre
							</Button>
							<Button
								size="sm"
								variant="destructive"
								disabled={busy !== null}
								onClick={() =>
									void run(`delete:${server.id}`, () =>
										apiClient.agents.mcp.delete(agentId, server.id, token),
									)
								}
							>
								<Trash2 className="mr-1 h-4 w-4" />
								Supprimer
							</Button>
							{busy?.endsWith(server.id) && <Loader2 className="h-4 w-4 animate-spin" />}
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
