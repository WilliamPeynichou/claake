"use client";

import type { Agent } from "@claake/shared";
import { MAX_SANDBOX_INTERACTIONS } from "@claake/shared";
import { useChat } from "@claake/shared/hooks";
import { AlertCircle, Bot, Key, Loader2, Send, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api";

interface ChatInterfaceProps {
	agent: Agent;
}

export function ChatInterface({ agent }: ChatInterfaceProps) {
	const [apiKey, setApiKey] = useState("");
	const [showKeyInput, setShowKeyInput] = useState(true);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const {
		messages,
		input,
		setInput,
		loading,
		error,
		sandboxCount,
		sandboxLimitReached,
		sendMessage,
	} = useChat({ agent, apiClient, apiKey: apiKey || undefined });

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, []);

	function saveApiKey() {
		if (!apiKey.trim()) return;
		setShowKeyInput(false);
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (sandboxLimitReached) {
			setShowKeyInput(true);
		}
		sendMessage();
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
							Clé API ({agent.models[0]?.includes("claude") ? "Anthropic" : "OpenAI"})
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
								Sans clé API, vous avez {MAX_SANDBOX_INTERACTIONS - sandboxCount} interaction
								{MAX_SANDBOX_INTERACTIONS - sandboxCount > 1 ? "s" : ""} sandbox restante
								{MAX_SANDBOX_INTERACTIONS - sandboxCount > 1 ? "s" : ""}.
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
				<form onSubmit={handleSubmit} className="flex gap-2">
					<Textarea
						placeholder="Écrivez votre message..."
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter" && !e.shiftKey) {
								e.preventDefault();
								handleSubmit(e);
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
