"use client";

import { FileText, Loader2, Paperclip, Send, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface PendingFile {
	id: string;
	name: string;
	type: "image" | "document";
	previewUrl?: string;
}

interface ChatInputProps {
	input: string;
	setInput: (value: string) => void;
	onSend: () => void;
	disabled: boolean;
	/** Auth token for uploading files */
	token?: string;
	/** Session ID to attach uploads to */
	sessionId?: string | null;
	/** Called when a file is successfully uploaded — returns its DB id */
	onFileUploaded?: (fileId: string) => void;
	/** Called when a pending file is removed before send */
	onFileRemoved?: (fileId: string) => void;
	/** File IDs already pending (controlled from parent) */
	pendingFileIds?: string[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002/v1";
const ACCEPTED = "image/jpeg,image/png,image/webp,application/pdf";
const MAX_SIZE = 10 * 1024 * 1024;

export function ChatInput({
	input,
	setInput,
	onSend,
	disabled,
	token,
	sessionId,
	onFileUploaded,
	onFileRemoved,
	pendingFileIds = [],
}: ChatInputProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
	const [uploading, setUploading] = useState(false);
	const [uploadError, setUploadError] = useState<string | null>(null);

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		onSend();
		setPendingFiles([]);
	}

	function handleKeyDown(e: React.KeyboardEvent) {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			onSend();
			setPendingFiles([]);
		}
	}

	const handleFileSelect = useCallback(
		async (files: FileList | null) => {
			if (!files || !token) return;
			setUploadError(null);

			for (const file of Array.from(files)) {
				if (file.size > MAX_SIZE) {
					setUploadError("Fichier trop volumineux (max 10 Mo).");
					continue;
				}

				setUploading(true);
				try {
					const formData = new FormData();
					formData.append("file", file);
					const params = new URLSearchParams();
					if (sessionId) params.set("sessionId", sessionId);

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
					const uploaded = json.data ?? json;
					const isImage = file.type.startsWith("image/");

					const pending: PendingFile = {
						id: uploaded.id,
						name: file.name,
						type: isImage ? "image" : "document",
						previewUrl: isImage ? URL.createObjectURL(file) : undefined,
					};

					setPendingFiles((prev) => [...prev, pending]);
					onFileUploaded?.(uploaded.id);
				} catch (err) {
					setUploadError(err instanceof Error ? err.message : "Erreur upload.");
				} finally {
					setUploading(false);
				}
			}
		},
		[token, sessionId, onFileUploaded],
	);

	function removeFile(fileId: string) {
		setPendingFiles((prev) => prev.filter((f) => f.id !== fileId));
		onFileRemoved?.(fileId);
	}

	const canSend = !disabled && (input.trim().length > 0 || pendingFiles.length > 0);

	return (
		<div className="border-t p-4">
			{/* Pending file pills */}
			{pendingFiles.length > 0 && (
				<div className="mx-auto mb-2 flex max-w-3xl flex-wrap gap-2">
					{pendingFiles.map((f) => (
						<div
							key={f.id}
							className="flex items-center gap-2 rounded-md border border-border/60 bg-card px-2 py-1"
						>
							{f.type === "image" && f.previewUrl ? (
								<img src={f.previewUrl} alt={f.name} className="h-6 w-6 rounded object-cover" />
							) : (
								<FileText className="h-4 w-4 text-muted-foreground" />
							)}
							<span className="max-w-[120px] truncate text-xs">{f.name}</span>
							<button
								type="button"
								onClick={() => removeFile(f.id)}
								className="text-muted-foreground hover:text-destructive"
							>
								<X className="h-3 w-3" />
							</button>
						</div>
					))}
				</div>
			)}

			{uploadError && (
				<p className="mx-auto mb-2 max-w-3xl text-xs text-destructive">{uploadError}</p>
			)}

			<form onSubmit={handleSubmit} className="mx-auto flex max-w-3xl items-end gap-2">
				{/* File attach button */}
				{token && (
					<>
						<input
							ref={fileInputRef}
							type="file"
							className="sr-only"
							accept={ACCEPTED}
							multiple
							onChange={(e) => handleFileSelect(e.target.files)}
						/>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="shrink-0 text-muted-foreground hover:text-foreground"
							disabled={disabled || uploading}
							onClick={() => fileInputRef.current?.click()}
						>
							{uploading ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Paperclip className="h-4 w-4" />
							)}
						</Button>
					</>
				)}

				<Textarea
					placeholder="Écrivez votre message..."
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={handleKeyDown}
					className="min-h-[44px] max-h-[120px] resize-none"
					rows={1}
					disabled={disabled}
				/>
				<Button type="submit" size="icon" disabled={!canSend}>
					<Send className="h-4 w-4" />
				</Button>
			</form>
		</div>
	);
}
