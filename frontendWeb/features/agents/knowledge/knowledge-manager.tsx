"use client";

import type { AgentKnowledge } from "@claake/shared";
import { Loader2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api";

interface KnowledgeManagerProps {
	agentId: string;
	token: string;
}

/** Gestion des documents de connaissance d'un agent (M6/F5.3). */
export function KnowledgeManager({ agentId, token }: KnowledgeManagerProps) {
	const [items, setItems] = useState<AgentKnowledge[]>([]);
	const [loading, setLoading] = useState(true);
	const [title, setTitle] = useState("");
	const [content, setContent] = useState("");
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		apiClient.agents.knowledge
			.list(agentId, token)
			.then(setItems)
			.catch(() => setError("Impossible de charger la base de connaissances."))
			.finally(() => setLoading(false));
	}, [agentId, token]);

	async function handleAdd() {
		if (!title.trim() || !content.trim()) {
			setError("Titre et contenu requis.");
			return;
		}
		setSaving(true);
		setError(null);
		try {
			const created = await apiClient.agents.knowledge.create(
				agentId,
				{ title: title.trim(), content: content.trim() },
				token,
			);
			setItems((prev) => [created, ...prev]);
			setTitle("");
			setContent("");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erreur lors de l'ajout.");
		} finally {
			setSaving(false);
		}
	}

	async function handleDelete(knowledgeId: string) {
		try {
			await apiClient.agents.knowledge.delete(agentId, knowledgeId, token);
			setItems((prev) => prev.filter((item) => item.id !== knowledgeId));
		} catch {
			setError("Suppression impossible.");
		}
	}

	return (
		<div className="space-y-4">
			<p className="text-sm text-muted-foreground">
				Ajoutez des documents (texte) que l&apos;agent utilisera comme contexte dans le chat.
			</p>

			{error && (
				<div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
					{error}
				</div>
			)}

			<div className="space-y-2 rounded-md border p-4">
				<div className="space-y-2">
					<Label htmlFor="knowledge-title">Titre</Label>
					<Input
						id="knowledge-title"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						placeholder="ex: Politique de retour"
						maxLength={200}
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="knowledge-content">Contenu</Label>
					<Textarea
						id="knowledge-content"
						value={content}
						onChange={(e) => setContent(e.target.value)}
						placeholder="Collez ici le texte de référence..."
						rows={5}
						maxLength={20000}
					/>
				</div>
				<Button onClick={handleAdd} disabled={saving}>
					{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
					Ajouter le document
				</Button>
			</div>

			{loading ? (
				<div className="flex justify-center py-6">
					<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
				</div>
			) : items.length === 0 ? (
				<p className="text-sm text-muted-foreground">Aucun document pour le moment.</p>
			) : (
				<ul className="space-y-2">
					{items.map((item) => (
						<li
							key={item.id}
							className="flex items-start justify-between gap-3 rounded-md border p-3"
						>
							<div className="min-w-0">
								<p className="text-sm font-medium">{item.title}</p>
								<p className="line-clamp-2 text-xs text-muted-foreground">{item.content}</p>
							</div>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => handleDelete(item.id)}
								aria-label="Supprimer"
							>
								<Trash2 className="h-4 w-4 text-destructive" />
							</Button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
