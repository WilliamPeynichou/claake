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
		<div className="border-t bg-card px-4 py-3">
			<div className="mx-auto flex max-w-3xl items-end gap-2">
				<textarea
					ref={textareaRef}
					value={value}
					onChange={(e) => {
						onChange(e.target.value);
						handleInput();
					}}
					onKeyDown={handleKeyDown}
					placeholder="Tapez votre message..."
					rows={1}
					disabled={disabled}
					className="flex-1 resize-none rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
				/>
				<button
					type="button"
					onClick={onSend}
					disabled={disabled || !value.trim()}
					className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
				>
					{streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
				</button>
			</div>
		</div>
	);
}
