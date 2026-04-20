import { Loader2, Send } from "lucide-react";
import { useRef } from "react";

interface ChatInputProps {
	value: string;
	onChange: (value: string) => void;
	onSend: () => void;
	disabled: boolean;
	streaming: boolean;
}

export function ChatInput({ value, onChange, onSend, disabled, streaming }: ChatInputProps) {
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	function handleKeyDown(e: React.KeyboardEvent) {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			if (!disabled && value.trim()) onSend();
		}
	}

	function handleInput() {
		const el = textareaRef.current;
		if (!el) return;
		el.style.height = "auto";
		el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
	}

	return (
		<div className="border-t px-6 py-5" style={{ background: "#faf9f5", borderColor: "#e8e4d8" }}>
			<div className="mx-auto flex max-w-3xl items-end gap-3">
				<textarea
					ref={textareaRef}
					value={value}
					onChange={(e) => {
						onChange(e.target.value);
						handleInput();
					}}
					onKeyDown={handleKeyDown}
					placeholder="Type a message... (Enter to send)"
					aria-label="Message"
					rows={1}
					disabled={disabled}
					className="flex-1 resize-none border px-4 py-3 text-sm leading-relaxed outline-none transition-colors focus:border-[#2a7a44] disabled:opacity-50"
					style={{ background: "#f3f0e8", borderColor: "#e8e4d8", color: "#1e1c18" }}
				/>
				<button
					type="button"
					onClick={onSend}
					disabled={disabled || !value.trim()}
					aria-label="Send message"
					className="flex h-11 w-11 shrink-0 items-center justify-center border transition-all disabled:opacity-40"
					style={{ borderColor: "#2a7a44", color: "#2a7a44", background: "transparent" }}
					onMouseEnter={(e) => {
						if (!(e.currentTarget as HTMLButtonElement).disabled) {
							(e.currentTarget as HTMLButtonElement).style.background = "#2a7a44";
							(e.currentTarget as HTMLButtonElement).style.color = "#faf9f5";
						}
					}}
					onMouseLeave={(e) => {
						(e.currentTarget as HTMLButtonElement).style.background = "transparent";
						(e.currentTarget as HTMLButtonElement).style.color = "#2a7a44";
					}}
					onFocus={(e) => {
						if (!(e.currentTarget as HTMLButtonElement).disabled) {
							(e.currentTarget as HTMLButtonElement).style.background = "#2a7a44";
							(e.currentTarget as HTMLButtonElement).style.color = "#faf9f5";
						}
					}}
					onBlur={(e) => {
						(e.currentTarget as HTMLButtonElement).style.background = "transparent";
						(e.currentTarget as HTMLButtonElement).style.color = "#2a7a44";
					}}
				>
					{streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
				</button>
			</div>
		</div>
	);
}
