"use client";

import { FileText, Loader2, Trash2, Upload } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";

interface UploadedFile {
	id: string;
	url: string;
	fileName: string;
	mimeType: string;
	size: number;
	type: "IMAGE" | "DOCUMENT";
}

interface FileUploaderProps {
	token: string;
	agentId?: string;
	sessionId?: string;
	initialFiles?: UploadedFile[];
	onUpload?: (file: UploadedFile) => void;
	onDelete?: (fileId: string) => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002/v1";
const ACCEPTED = "image/jpeg,image/png,image/webp,application/pdf";
const MAX_SIZE = 10 * 1024 * 1024;

function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} o`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function FileUploader({
	token,
	agentId,
	sessionId,
	initialFiles = [],
	onUpload,
	onDelete,
}: FileUploaderProps) {
	const [files, setFiles] = useState<UploadedFile[]>(initialFiles);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [dragOver, setDragOver] = useState(false);

	const uploadFile = useCallback(
		async (file: File) => {
			if (file.size > MAX_SIZE) {
				setError("Fichier trop volumineux (max 10 Mo).");
				return;
			}

			setUploading(true);
			setError(null);

			const formData = new FormData();
			formData.append("file", file);

			const params = new URLSearchParams();
			if (agentId) params.set("agentId", agentId);
			if (sessionId) params.set("sessionId", sessionId);

			try {
				const res = await fetch(`${API_BASE}/uploads?${params}`, {
					method: "POST",
					headers: { Authorization: `Bearer ${token}` },
					body: formData,
				});

				if (!res.ok) {
					const body = await res.json().catch(() => ({}));
					throw new Error(body.error?.message ?? `Erreur ${res.status}`);
				}

				const json = await res.json();
				const uploaded: UploadedFile = json.data ?? json;
				setFiles((prev) => [uploaded, ...prev]);
				onUpload?.(uploaded);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Erreur lors de l'upload.");
			} finally {
				setUploading(false);
			}
		},
		[token, agentId, sessionId, onUpload],
	);

	const handleFiles = useCallback(
		(fileList: FileList | null) => {
			if (!fileList) return;
			for (const file of Array.from(fileList)) {
				uploadFile(file);
			}
		},
		[uploadFile],
	);

	const handleDelete = useCallback(
		async (fileId: string) => {
			try {
				const res = await fetch(`${API_BASE}/uploads/${fileId}`, {
					method: "DELETE",
					headers: { Authorization: `Bearer ${token}` },
				});
				if (res.ok || res.status === 204) {
					setFiles((prev) => prev.filter((f) => f.id !== fileId));
					onDelete?.(fileId);
				}
			} catch {
				// silent
			}
		},
		[token, onDelete],
	);

	return (
		<div className="space-y-4">
			{/* Drop zone */}
			<div
				className={[
					"flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
					dragOver
						? "border-brand bg-brand-subtle"
						: "border-border/60 hover:border-brand/40",
				].join(" ")}
				onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
				onDragLeave={() => setDragOver(false)}
				onDrop={(e) => {
					e.preventDefault();
					setDragOver(false);
					handleFiles(e.dataTransfer.files);
				}}
			>
				{uploading ? (
					<Loader2 className="h-8 w-8 animate-spin text-brand" />
				) : (
					<Upload className="h-8 w-8 text-muted-foreground" />
				)}
				<p className="mt-3 text-sm font-medium">
					{uploading ? "Upload en cours…" : "Glissez vos fichiers ici"}
				</p>
				<p className="mt-1 text-xs text-muted-foreground">JPG, PNG, WebP, PDF — max 10 Mo</p>
				<label className="mt-4 cursor-pointer">
					<input
						type="file"
						className="sr-only"
						accept={ACCEPTED}
						multiple
						onChange={(e) => handleFiles(e.target.files)}
					/>
					<Button type="button" variant="outline" size="sm" asChild>
						<span>Parcourir</span>
					</Button>
				</label>
			</div>

			{/* Error */}
			{error && (
				<p className="text-sm text-destructive">{error}</p>
			)}

			{/* File list */}
			{files.length > 0 && (
				<ul className="space-y-2">
					{files.map((f) => (
						<li
							key={f.id}
							className="flex items-center gap-3 rounded-md border border-border/60 bg-card p-3"
						>
							{f.type === "IMAGE" ? (
								<img
									src={f.url}
									alt={f.fileName}
									className="h-10 w-10 rounded object-cover border border-border/40"
								/>
							) : (
								<div className="flex h-10 w-10 items-center justify-center rounded border border-border/40 bg-muted">
									<FileText className="h-5 w-5 text-muted-foreground" />
								</div>
							)}
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm font-medium">{f.fileName}</p>
								<p className="text-xs text-muted-foreground">{formatBytes(f.size)}</p>
							</div>
							<button
								type="button"
								onClick={() => handleDelete(f.id)}
								className="shrink-0 rounded p-1 text-muted-foreground hover:text-destructive transition-colors"
							>
								<Trash2 className="h-4 w-4" />
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
