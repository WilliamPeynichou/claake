"use client";

import type { AgentKnowledge } from "@claake/shared";
import { Edit2, FileUp, Loader2, RefreshCw, Save, Trash2, X } from "lucide-react";
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
	const [importingPdf, setImportingPdf] = useState(false);
	const [reindexing, setReindexing] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editTitle, setEditTitle] = useState("");
	const [editContent, setEditContent] = useState("");
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

	async function handleReindex() {
		setReindexing(true);
		setError(null);
		try {
			const result = await apiClient.agents.knowledge.reindex(agentId, token);
			if (result.indexed === 0) setError("Aucun document à réindexer.");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Réindexation impossible.");
		} finally {
			setReindexing(false);
		}
	}

	async function handlePdf(file: File | undefined) {
		if (!file) return;
		setImportingPdf(true);
		setError(null);
		try {
			const created = await apiClient.agents.knowledge.createFromPdf(
				agentId,
				file,
				file.name,
				token,
			);
			setItems((prev) => [created, ...prev]);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Import PDF impossible.");
		} finally {
			setImportingPdf(false);
		}
	}

	function startEdit(item: AgentKnowledge) {
		setEditingId(item.id);
		setEditTitle(item.title);
		setEditContent(item.content);
	}

	async function handleUpdate(knowledgeId: string) {
		if (!editTitle.trim() || !editContent.trim()) {
			setError("Titre et contenu requis.");
			return;
		}
		try {
			const updated = await apiClient.agents.knowledge.update(
				agentId,
				knowledgeId,
				{ title: editTitle.trim(), content: editContent.trim() },
				token,
			);
			setItems((prev) => prev.map((item) => (item.id === knowledgeId ? updated : item)));
			setEditingId(null);
		} catch {
			setError("Modification impossible.");
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
				Ajoutez du texte ou importez un PDF. Le contenu est découpé puis indexé ; la recherche
				vectorielle est utilisée quand le provider embeddings est configuré, sinon le fallback par
				mots-clés reste actif.
			</p>

			<div className="flex justify-end">
				<Button variant="outline" size="sm" onClick={handleReindex} disabled={reindexing}>
					{reindexing ? (
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					) : (
						<RefreshCw className="mr-2 h-4 w-4" />
					)}
					Réindexer les documents
				</Button>
			</div>

			{error && (
				<div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
					{error}
				</div>
			)}

			<div className="rounded-md border p-4">
				<Label htmlFor="knowledge-pdf">Importer un PDF</Label>
				<div className="mt-2 flex items-center gap-2">
					<Input
						id="knowledge-pdf"
						type="file"
						accept="application/pdf,.pdf"
						disabled={importingPdf}
						onChange={(event) => handlePdf(event.target.files?.[0])}
					/>
					{importingPdf ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<FileUp className="h-4 w-4" />
					)}
				</div>
			</div>

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
						<li key={item.id} className="rounded-md border p-3">
							{editingId === item.id ? (
								<div className="space-y-2">
									<Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
									<Textarea
										value={editContent}
										onChange={(e) => setEditContent(e.target.value)}
										rows={4}
									/>
									<div className="flex gap-2">
										<Button size="sm" onClick={() => handleUpdate(item.id)}>
											<Save className="mr-1 h-3 w-3" />
											Enregistrer
										</Button>
										<Button variant="outline" size="sm" onClick={() => setEditingId(null)}>
											<X className="mr-1 h-3 w-3" />
											Annuler
										</Button>
									</div>
								</div>
							) : (
								<div className="flex items-start justify-between gap-3">
									<div className="min-w-0">
										<p className="text-sm font-medium">{item.title}</p>
										<p className="line-clamp-2 text-xs text-muted-foreground">{item.content}</p>
									</div>
									<div className="flex gap-1">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => startEdit(item)}
											aria-label="Modifier"
										>
											<Edit2 className="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleDelete(item.id)}
											aria-label="Supprimer"
										>
											<Trash2 className="h-4 w-4 text-destructive" />
										</Button>
									</div>
								</div>
							)}
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
