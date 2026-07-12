"use client";

import type { AgentSkill } from "@claake/shared";
import { FilePlus2, FolderUp, Loader2, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api";

const MAX_FILES = 100;

export function SkillManager({ agentId, token }: { agentId: string; token: string }) {
	const fileInput = useRef<HTMLInputElement>(null);
	const folderInput = useRef<HTMLInputElement>(null);
	const [skills, setSkills] = useState<AgentSkill[]>([]);
	const [name, setName] = useState("");
	const [files, setFiles] = useState<File[]>([]);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		try {
			setSkills(await apiClient.agents.skills.list(agentId, token));
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "Chargement des skills impossible.");
		}
	}, [agentId, token]);
	useEffect(() => void load(), [load]);

	function selectFiles(selected: FileList | null) {
		const next = Array.from(selected ?? []);
		if (next.length === 0) return;
		if (next.length > MAX_FILES) {
			setError(`Maximum ${MAX_FILES} fichiers Markdown par import.`);
			return;
		}
		const invalid = next.find((file) => !file.name.toLowerCase().endsWith(".md"));
		if (invalid) {
			setError(`Seuls les fichiers .md sont acceptés : ${invalid.name}`);
			return;
		}
		setError(null);
		setFiles(next);
	}

	async function importSkill() {
		if (!name.trim() || files.length === 0) return;
		setBusy(true);
		setError(null);
		try {
			await apiClient.agents.skills.importMarkdown(agentId, { name }, files, token);
			setName("");
			setFiles([]);
			if (fileInput.current) fileInput.current.value = "";
			if (folderInput.current) folderInput.current.value = "";
			await load();
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "Import du skill impossible.");
		} finally {
			setBusy(false);
		}
	}

	async function remove(skill: AgentSkill) {
		setBusy(true);
		try {
			await apiClient.agents.skills.delete(agentId, skill.id, token);
			await load();
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "Suppression du skill impossible.");
		} finally {
			setBusy(false);
		}
	}

	return (
		<div className="space-y-4">
			<p className="text-sm text-muted-foreground">
				Importez un fichier ou dossier de ressources. Seuls fichiers Markdown <code>.md</code> sont
				acceptés et revalidés par le serveur.
			</p>
			{error && <p className="text-sm text-destructive">{error}</p>}
			<div className="space-y-3 rounded-lg border p-4">
				<div>
					<Label htmlFor="skill-name">Nom du skill</Label>
					<Input id="skill-name" value={name} onChange={(event) => setName(event.target.value)} />
				</div>
				<div className="flex flex-wrap gap-2">
					<Button type="button" variant="outline" onClick={() => fileInput.current?.click()}>
						<FilePlus2 className="mr-2 h-4 w-4" />
						Choisir des fichiers .md
					</Button>
					<Button type="button" variant="outline" onClick={() => folderInput.current?.click()}>
						<FolderUp className="mr-2 h-4 w-4" />
						Choisir un dossier
					</Button>
					<input
						ref={fileInput}
						type="file"
						accept=".md,text/markdown,text/plain"
						multiple
						className="hidden"
						onChange={(event) => selectFiles(event.target.files)}
					/>
					<input
						ref={folderInput}
						type="file"
						accept=".md,text/markdown,text/plain"
						multiple
						className="hidden"
						{...({ webkitdirectory: "", directory: "" } as Record<string, string>)}
						onChange={(event) => selectFiles(event.target.files)}
					/>
				</div>
				{files.length > 0 && (
					<p className="text-sm">{files.length} fichier(s) .md sélectionné(s)</p>
				)}
				<Button
					disabled={busy || !name.trim() || files.length === 0}
					onClick={() => void importSkill()}
				>
					{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
					Importer le skill
				</Button>
			</div>
			{skills.map((skill) => (
				<Card key={skill.id}>
					<CardContent className="flex items-start justify-between gap-4 p-4">
						<div>
							<p className="font-medium">{skill.name}</p>
							<p className="text-sm text-muted-foreground">
								{skill.resources.length} ressource(s) :{" "}
								{skill.resources.map((item) => item.path).join(", ")}
							</p>
						</div>
						<Button
							variant="destructive"
							size="sm"
							disabled={busy}
							onClick={() => void remove(skill)}
						>
							<Trash2 className="mr-2 h-4 w-4" />
							Supprimer
						</Button>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
