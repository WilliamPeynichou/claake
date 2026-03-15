"use client";

import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
	input: string;
	setInput: (value: string) => void;
	onSend: () => void;
	disabled: boolean;
}

export function ChatInput({ input, setInput, onSend, disabled }: ChatInputProps) {
	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		onSend();
	}

	function handleKeyDown(e: React.KeyboardEvent) {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			onSend();
		}
	}

	return (
		<div className="border-t p-4">
			<form onSubmit={handleSubmit} className="mx-auto flex max-w-3xl gap-2">
				<Textarea
					placeholder="Écrivez votre message..."
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={handleKeyDown}
					className="min-h-[44px] max-h-[120px] resize-none"
					rows={1}
					disabled={disabled}
				/>
				<Button type="submit" size="icon" disabled={disabled || !input.trim()}>
					<Send className="h-4 w-4" />
				</Button>
			</form>
		</div>
	);
}
