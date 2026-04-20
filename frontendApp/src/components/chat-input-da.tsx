import { FileText, Loader2, Paperclip, Send, Square, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";

interface PendingFile {
	id: string;
	name: string;
	isImage: boolean;
	previewUrl?: string;
}

interface Props {
	value: string;
	onChange: (value: string) => void;
	onSend: () => void;
	disabled: boolean;
	streaming: boolean;
	stop: () => void;
	token?: string;
	sessionId?: string | null;
	onFileUploaded?: (fileId: string) => void;
	onFileRemoved?: (fileId: string) => void;
}

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3002/v1";

export function ChatInputDA({
	value,
	onChange,
	onSend,
	disabled,
	streaming,
	stop,
	token,
	sessionId,
	onFileUploaded,
	onFileRemoved,
}: Props) {
	const fileRef = useRef<HTMLInputElement>(null);
	const [files, setFiles] = useState<PendingFile[]>([]);
	const [uploading, setUploading] = useState(false);
	const [uploadErr, setUploadErr] = useState<string | null>(null);

	const onFile = useCallback(
		async (fl: FileList | null) => {
			if (!fl || !token) return;
			setUploadErr(null);
			setUploading(true);
			for (const file of Array.from(fl)) {
				if (file.size > 10485760) {
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
				} catch (e) {
					setUploadErr(e instanceof Error ? e.message : "Erreur");
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

	function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			if (!disabled && !streaming) {
				onSend();
				setFiles([]);
			}
		}
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!disabled && !streaming) {
			onSend();
			setFiles([]);
		}
	}

	const canSend = (value.trim().length > 0 || files.length > 0) && !disabled;

	return (
		<div style={{ borderTop: "1px solid #e8e4d8", background: "#faf9f5", padding: "1rem 1.5rem" }}>
			{files.length > 0 && (
				<div className="flex flex-wrap gap-2 mb-3">
					{files.map((f) => (
						<div
							key={f.id}
							className="flex items-center gap-2 px-2 py-1"
							style={{ background: "#f3f0e8", border: "1px solid #e8e4d8", fontSize: "0.75rem" }}
						>
							{f.isImage && f.previewUrl ? (
								<img src={f.previewUrl} alt={f.name} className="h-5 w-5 object-cover" />
							) : (
								<FileText className="h-4 w-4" style={{ color: "#a09a8a" }} />
							)}
							<span className="max-w-[100px] truncate" style={{ color: "#6b6558" }}>
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
				<p className="mb-2 text-xs" style={{ color: "#c44" }}>
					{uploadErr}
				</p>
			)}
			<form onSubmit={handleSubmit} className="flex items-end gap-2 max-w-3xl mx-auto">
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
							className="shrink-0 p-2"
							style={{ color: uploading ? "#d0dac4" : "#a09a8a" }}
						>
							{uploading ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Paperclip className="h-4 w-4" />
							)}
						</button>
					</>
				)}
				<textarea
					value={value}
					onChange={(e) => onChange(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder="Écrivez votre message…"
					rows={1}
					className="flex-1 resize-none px-3 py-2 text-sm outline-none"
					style={{
						background: "#faf9f5",
						border: "1px solid #e8e4d8",
						minHeight: "44px",
						maxHeight: "120px",
						color: "#1e1c18",
						fontFamily: "'DM Sans', system-ui, sans-serif",
					}}
				/>
				{streaming ? (
					<button
						type="button"
						onClick={stop}
						className="shrink-0 p-2"
						style={{ background: "#6b7c5c", color: "#faf9f5", border: "1px solid #6b7c5c" }}
					>
						<Square className="h-4 w-4" />
					</button>
				) : (
					<button
						type="submit"
						disabled={!canSend}
						className="shrink-0 p-2 transition-colors"
						style={{
							background: canSend ? "#6b7c5c" : "transparent",
							color: canSend ? "#faf9f5" : "#d0dac4",
							border: "1px solid",
							borderColor: canSend ? "#6b7c5c" : "#d0dac4",
						}}
					>
						<Send className="h-4 w-4" />
					</button>
				)}
			</form>
		</div>
	);
}
