"use client";

import type { Agent } from "@claake/shared";
import { FileText, Loader2, Paperclip, Send, Square, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";

interface PendingFile {
	id: string;
	name: string;
	isImage: boolean;
	previewUrl?: string;
}

interface MultimodalInputProps {
	value: string;
	onChange: (value: string) => void;
	onSend: () => void;
	disabled: boolean;
	streaming: boolean;
	stop: () => void;
	token?: string;
	sessionId?: string | null;
	currentAgent: Agent | null;
	onFileUploaded?: (fileId: string) => void;
	onFileRemoved?: (fileId: string) => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002/v1";

export function MultimodalInput({
	value,
	onChange,
	onSend,
	disabled,
	streaming,
	stop,
	token,
	sessionId,
	currentAgent,
	onFileUploaded,
	onFileRemoved,
}: MultimodalInputProps) {
	const fileRef = useRef<HTMLInputElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const [files, setFiles] = useState<PendingFile[]>([]);
	const [uploading, setUploading] = useState(false);
	const [uploadErr, setUploadErr] = useState<string | null>(null);

	const handleInput = useCallback(
		(e: React.ChangeEvent<HTMLTextAreaElement>) => {
			onChange(e.target.value);
			const el = e.target;
			el.style.height = "auto";
			el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
		},
		[onChange],
	);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				if (!disabled && !streaming && (value.trim() || files.length > 0)) {
					onSend();
					setFiles([]);
					if (textareaRef.current) textareaRef.current.style.height = "auto";
				}
			}
		},
		[disabled, streaming, value, files.length, onSend],
	);

	const handleSubmit = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();
			if (!disabled && !streaming && (value.trim() || files.length > 0)) {
				onSend();
				setFiles([]);
				if (textareaRef.current) textareaRef.current.style.height = "auto";
			}
		},
		[disabled, streaming, value, files.length, onSend],
	);

	const onFile = useCallback(
		async (fl: FileList | null) => {
			if (!fl || !token) return;
			setUploadErr(null);
			setUploading(true);
			for (const file of Array.from(fl)) {
				if (file.size > 10_485_760) {
					setUploadErr("Max 10 Mo");
					continue;
				}
				try {
					const fd = new FormData();
					fd.append("file", file);
					const p = new URLSearchParams();
					if (sessionId) p.set("sessionId", sessionId);
					const res = await fetch(`${API_BASE}/uploads?${p}`, {
						method: "POST",
						headers: { Authorization: `Bearer ${token}` },
						body: fd,
					});
					if (!res.ok) throw new Error("Upload échoué");
					const json = await res.json();
					const up = json.data ?? json;
					const isImage = file.type.startsWith("image/");
					setFiles((prev) => [
						...prev,
						{
							id: up.id,
							name: file.name,
							isImage,
							previewUrl: isImage ? URL.createObjectURL(file) : undefined,
						},
					]);
					onFileUploaded?.(up.id);
				} catch (err) {
					setUploadErr(err instanceof Error ? err.message : "Erreur upload");
				}
			}
			setUploading(false);
		},
		[token, sessionId, onFileUploaded],
	);

	function removeFile(id: string) {
		setFiles((prev) => prev.filter((f) => f.id !== id));
		onFileRemoved?.(id);
	}

	const canSend = (value.trim().length > 0 || files.length > 0) && !disabled;

	return (
		<div style={{ padding: "0.75rem 1rem 1rem", background: "#faf9f5" }}>
			<div
				className="max-w-3xl mx-auto"
				style={{
					background: "#f3f0e8",
					border: "1px solid #d4cfc0",
					borderRadius: "16px",
					overflow: "hidden",
				}}
			>
				{/* File previews */}
				{files.length > 0 && (
					<div className="flex flex-wrap gap-2 px-4 pt-3">
						{files.map((f) => (
							<div
								key={f.id}
								className="flex items-center gap-1.5 px-2 py-1"
								style={{
									background: "#e8ede0",
									border: "1px solid #d0dac4",
									borderRadius: "4px",
									fontSize: "0.72rem",
								}}
							>
								{f.isImage && f.previewUrl ? (
									<img src={f.previewUrl} alt={f.name} className="h-4 w-4 object-cover rounded" />
								) : (
									<FileText className="h-3.5 w-3.5" style={{ color: "#a09a8a" }} />
								)}
								<span
									className="max-w-[100px] truncate"
									style={{ color: "#6b6558", fontFamily: "'DM Sans', system-ui" }}
								>
									{f.name}
								</span>
								<button type="button" onClick={() => removeFile(f.id)}>
									<X className="h-3 w-3" style={{ color: "#a09a8a" }} />
								</button>
							</div>
						))}
					</div>
				)}

				{uploadErr && (
					<p
						className="px-4 pt-2 text-xs"
						style={{ color: "#c44444", fontFamily: "'DM Sans', system-ui" }}
					>
						{uploadErr}
					</p>
				)}

				{/* Textarea */}
				<form onSubmit={handleSubmit}>
					<textarea
						ref={textareaRef}
						value={value}
						onChange={handleInput}
						onKeyDown={handleKeyDown}
						placeholder="Envoyer un message…"
						rows={1}
						className="w-full resize-none outline-none bg-transparent px-4 py-3"
						style={{
							fontFamily: "'DM Sans', system-ui, sans-serif",
							fontSize: "0.875rem",
							color: "#1e1c18",
							lineHeight: "1.6",
							minHeight: "52px",
							maxHeight: "200px",
						}}
					/>

					{/* Bottom toolbar */}
					<div className="flex items-center justify-between px-3 pb-3">
						{/* Left: agent selector + attach */}
						<div className="flex items-center gap-2">
							{currentAgent && (
								<span
									className="px-2 py-1"
									style={{
										background: "#e8ede0",
										border: "1px solid #d0dac4",
										color: "#4e5c42",
										fontFamily: "'DM Sans', system-ui",
										fontSize: "0.75rem",
										fontWeight: 500,
										borderRadius: "6px",
									}}
								>
									{currentAgent.name}
								</span>
							)}
							{token && (
								<>
									<input
										ref={fileRef}
										type="file"
										className="sr-only"
										accept="image/jpeg,image/png,image/webp,application/pdf"
										multiple
										onChange={(e) => onFile(e.target.files)}
									/>
									<button
										type="button"
										onClick={() => fileRef.current?.click()}
										disabled={uploading}
										className="p-1.5 transition-colors rounded"
										style={{ color: uploading ? "#d0dac4" : "#a09a8a" }}
										onMouseEnter={(e) => {
											if (!uploading) e.currentTarget.style.color = "#6b7c5c";
										}}
										onMouseLeave={(e) => {
											if (!uploading) e.currentTarget.style.color = "#a09a8a";
										}}
										title="Joindre un fichier"
									>
										{uploading ? (
											<Loader2 className="h-4 w-4 animate-spin" />
										) : (
											<Paperclip className="h-4 w-4" />
										)}
									</button>
								</>
							)}
						</div>

						{/* Right: stop or send */}
						{streaming ? (
							<button
								type="button"
								onClick={stop}
								className="h-8 w-8 flex items-center justify-center transition-colors"
								style={{
									background: "#6b7c5c",
									color: "#faf9f5",
									borderRadius: "8px",
								}}
								onMouseEnter={(e) => (e.currentTarget.style.background = "#4e5c42")}
								onMouseLeave={(e) => (e.currentTarget.style.background = "#6b7c5c")}
							>
								<Square className="h-3.5 w-3.5" />
							</button>
						) : (
							<button
								type="submit"
								disabled={!canSend}
								className="h-8 w-8 flex items-center justify-center transition-colors"
								style={{
									background: canSend ? "#6b7c5c" : "#e8e4d8",
									color: canSend ? "#faf9f5" : "#a09a8a",
									borderRadius: "8px",
									cursor: canSend ? "pointer" : "default",
								}}
								onMouseEnter={(e) => {
									if (canSend) e.currentTarget.style.background = "#4e5c42";
								}}
								onMouseLeave={(e) => {
									if (canSend) e.currentTarget.style.background = "#6b7c5c";
								}}
							>
								<Send className="h-3.5 w-3.5" />
							</button>
						)}
					</div>
				</form>
			</div>

			<p
				className="text-center mt-2"
				style={{ fontSize: "0.65rem", color: "#a09a8a", fontFamily: "'DM Sans', system-ui" }}
			>
				Shift+Entrée pour un saut de ligne
			</p>
		</div>
	);
}
