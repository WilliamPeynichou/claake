"use client";

import type { Agent, ChatMessage } from "@agentplace/shared";
import { AlertCircle, Bot, Key, Loader2, Send, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

interface ChatInterfaceProps {
	agent: Agent;
}

export function ChatInterface({ agent }: ChatInterfaceProps) {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [input, setInput] = useState("");
	const [apiKey, setApiKey] = useState("");
	const [showKeyInput, setShowKeyInput] = useState(true);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [sandboxCount, setSandboxCount] = useState(0);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const maxSandbox = 3;

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, []);

	function saveApiKey() {
		if (!apiKey.trim()) return;
		setShowKeyInput(false);
	}

	async function sendMessage(e: React.FormEvent) {
		e.preventDefault();
		if (!input.trim()) return;

		if (!apiKey && sandboxCount >= maxSandbox) {
			setError(
				"Vous avez atteint la limite de 3 interactions sandbox. Ajoutez votre clé API pour continuer.",
			);
			setShowKeyInput(true);
			return;
		}

		const userMessage: ChatMessage = {
			id: crypto.randomUUID(),
			role: "user",
			content: input.trim(),
			timestamp: new Date().toISOString(),
		};

		setMessages((prev) => [...prev, userMessage]);
		setInput("");
		setLoading(true);
		setError(null);

		try {
			const res = await fetch("/api/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					agent_id: agent.id,
					message: userMessage.content,
					api_key: apiKey || undefined,
					history: messages.map((m) => ({ role: m.role, content: m.content })),
					system_prompt: agent.long_description ?? agent.description,
					model: agent.model,
				}),
			});

			const data = await res.json();

			if (!res.ok) {
				setError(data.error ?? "Erreur lors de l'envoi du message.");
				return;
			}

			const assistantMessage: ChatMessage = {
				id: crypto.randomUUID(),
				role: "assistant",
				content: data.content ?? data.message ?? "Réponse reçue.",
				timestamp: new Date().toISOString(),
			};

			setMessages((prev) => [...prev, assistantMessage]);

			if (!apiKey) {
				setSandboxCount((c) => c + 1);
			}
		} catch {
			setError("Impossible de contacter le serveur.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<Card className="flex h-[600px] flex-col">
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<CardTitle className="flex items-center gap-2 text-lg">
						<Bot className="h-5 w-5" />
						Chat avec {agent.name}
					</CardTitle>
					<Button variant="ghost" size="sm" onClick={() => setShowKeyInput(!showKeyInput)}>
						<Key className="mr-1 h-4 w-4" />
						Clé API
					</Button>
				</div>

				{showKeyInput && (
					<div className="mt-3 space-y-2 rounded-md border bg-muted/50 p-3">
						<Label htmlFor="apiKey" className="text-xs">
							Clé API ({agent.model.includes("claude") ? "Anthropic" : "OpenAI"})
						</Label>
						<div className="flex gap-2">
							<Input
								id="apiKey"
								type="password"
								placeholder="sk-..."
								value={apiKey}
								onChange={(e) => setApiKey(e.target.value)}
								className="text-sm"
							/>
							<Button size="sm" onClick={saveApiKey}>
								Enregistrer
							</Button>
						</div>
						{!apiKey && (
							<p className="text-xs text-muted-foreground">
								Sans clé API, vous avez {maxSandbox - sandboxCount} interaction
								{maxSandbox - sandboxCount > 1 ? "s" : ""} sandbox restante
								{maxSandbox - sandboxCount > 1 ? "s" : ""}.
							</p>
						)}
					</div>
				)}
			</CardHeader>

			<Separator />

			{/* Messages */}
			<CardContent className="flex-1 overflow-y-auto p-4">
				{messages.length === 0 ? (
					<div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
						<Bot className="h-12 w-12 text-muted-foreground/30" />
						<p className="mt-4 text-sm">
							Envoyez un message pour commencer la conversation avec <strong>{agent.name}</strong>.
						</p>
					</div>
				) : (
					<div className="space-y-4">
						{messages.map((msg) => (
							<div
								key={msg.id}
								className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
							>
								{msg.role === "assistant" && (
									<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
										<Bot className="h-4 w-4 text-primary" />
									</div>
								)}
								<div
									className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${
										msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
									}`}
								>
									<p className="whitespace-pre-wrap">{msg.content}</p>
								</div>
								{msg.role === "user" && (
									<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
										<User className="h-4 w-4" />
									</div>
								)}
							</div>
						))}
						{loading && (
							<div className="flex gap-3">
								<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
									<Bot className="h-4 w-4 text-primary" />
								</div>
								<div className="rounded-lg bg-muted px-4 py-2">
									<Loader2 className="h-4 w-4 animate-spin" />
								</div>
							</div>
						)}
						<div ref={messagesEndRef} />
					</div>
				)}
			</CardContent>

			{/* Error */}
			{error && (
				<div className="mx-4 mb-2 flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
					<AlertCircle className="h-4 w-4 shrink-0" />
					{error}
				</div>
			)}

			{/* Input */}
			<div className="border-t p-4">
				<form onSubmit={sendMessage} className="flex gap-2">
					<Textarea
						placeholder="Écrivez votre message..."
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter" && !e.shiftKey) {
								e.preventDefault();
								sendMessage(e);
							}
						}}
						className="min-h-[44px] max-h-[120px] resize-none"
						rows={1}
					/>
					<Button type="submit" size="icon" disabled={loading || !input.trim()}>
						<Send className="h-4 w-4" />
					</Button>
				</form>
			</div>
		</Card>
	);
}
