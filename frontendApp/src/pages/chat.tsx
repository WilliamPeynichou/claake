import type { Agent, AgentChatConfig } from "@claake/shared";
import { useChat } from "@claake/shared/hooks";
import { openUrl } from "@tauri-apps/plugin-opener";
import { AlertCircle, KeyRound, Loader2, ShoppingCart } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ApiKeysPanel } from "@/components/api-keys-panel";
import { ChatInputDA } from "@/components/chat-input-da";
import { ChatSidebar } from "@/components/chat-sidebar";
import { ChatThread } from "@/components/chat-thread";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type ViewMode = "chat" | "settings";

export function ChatPage() {
	const { token, profile, signOut } = useAuth();
	const [searchParams, setSearchParams] = useSearchParams();
	const agentParam = searchParams.get("agent");
	const [agents, setAgents] = useState<Agent[]>([]);
	const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
	const [chatConfig, setChatConfig] = useState<AgentChatConfig | null>(null);
	const [configLoading, setConfigLoading] = useState(false);
	const [configError, setConfigError] = useState<string | null>(null);
	const [agentsError, setAgentsError] = useState<string | null>(null);
	const [viewMode, setViewMode] = useState<ViewMode>("chat");

	const {
		messages,
		input,
		setInput,
		streaming,
		error,
		sessionId,
		sessions,
		addPendingFile,
		removePendingFile,
		sendMessage,
		retry,
		canRetry,
		loadSession,
		deleteSession,
		stop,
	} = useChat({ apiClient, token, agentId: selectedAgent?.id });

	useEffect(() => {
		let cancelled = false;
		setAgentsError(null);
		apiClient.agents
			.list({ limit: 100 })
			.then((res) => {
				if (cancelled) return;
				setAgents(res.agents);
				if (agentParam) {
					const found = res.agents.find((agent) => agent.id === agentParam);
					if (found) setSelectedAgent(found);
				}
			})
			.catch((err) => {
				if (!cancelled) {
					setAgentsError(err instanceof Error ? err.message : "Impossible de charger les agents.");
				}
			});
		return () => {
			cancelled = true;
		};
	}, [agentParam]);

	const loadChatConfig = useCallback(
		async (agentId: string) => {
			setConfigLoading(true);
			setChatConfig(null);
			setConfigError(null);
			try {
				const config = await apiClient.agents.chatConfig(agentId, token);
				setChatConfig(config);
			} catch (error) {
				setChatConfig(null);
				setConfigError(
					error instanceof Error
						? error.message
						: "Impossible de charger la configuration du chat.",
				);
			} finally {
				setConfigLoading(false);
			}
		},
		[token],
	);

	useEffect(() => {
		if (selectedAgent) void loadChatConfig(selectedAgent.id);
		else {
			setChatConfig(null);
			setConfigError(null);
		}
	}, [loadChatConfig, selectedAgent]);

	const handleSelectSession = useCallback(
		async (session: { id: string; agent_id: string; agent_name: string }) => {
			const agent = agents.find((item) => item.id === session.agent_id);
			if (agent) {
				setSelectedAgent(agent);
				setSearchParams({ agent: agent.id });
			}
			setViewMode("chat");
			await loadSession(session.id);
		},
		[agents, loadSession, setSearchParams],
	);

	const handleNewChat = useCallback(
		async (agent: Agent) => {
			setSelectedAgent(agent);
			setSearchParams({ agent: agent.id });
			setViewMode("chat");
			await loadChatConfig(agent.id);
		},
		[loadChatConfig, setSearchParams],
	);

	function openSettings(requiredProvider?: string | null) {
		setViewMode("settings");
		if (requiredProvider) {
			setSearchParams((prev) => {
				const next = new URLSearchParams(prev);
				next.set("provider", requiredProvider);
				return next;
			});
		}
	}

	const requiredProvider =
		searchParams.get("provider") ?? chatConfig?.access.required_provider ?? null;

	return (
		<div className="flex h-screen" style={{ background: "#faf9f5" }}>
			<ChatSidebar
				agents={agents}
				sessions={sessions}
				activeSessionId={sessionId}
				onSelectSession={handleSelectSession}
				onNewChat={handleNewChat}
				onDeleteSession={deleteSession}
				onOpenSettings={() => openSettings()}
				onSignOut={signOut}
				userName={profile?.display_name ?? profile?.email ?? null}
			/>

			{viewMode === "settings" ? (
				<ApiKeysPanel
					token={token}
					requiredProvider={requiredProvider}
					onBackToChat={() => setViewMode("chat")}
				/>
			) : (
				<main className="flex min-w-0 flex-1 flex-col">
					<DesktopChatHeader
						selectedAgent={selectedAgent}
						chatConfig={chatConfig}
						configLoading={configLoading}
						configError={configError}
						agentsError={agentsError}
					/>

					{selectedAgent && configError ? (
						<ConfigErrorState
							error={configError}
							onRetry={() => loadChatConfig(selectedAgent.id)}
						/>
					) : selectedAgent && chatConfig && !chatConfig.access.can_chat ? (
						<AccessState
							config={chatConfig}
							token={token}
							onOpenSettings={openSettings}
							onRefresh={() => loadChatConfig(chatConfig.id)}
						/>
					) : (
						<>
							<ChatThread
								messages={messages}
								streaming={streaming}
								error={error}
								agentName={chatConfig?.name ?? selectedAgent?.name}
								welcomeMessage={chatConfig?.welcome_message}
								suggestedPrompts={chatConfig?.suggested_prompts ?? []}
								onUsePrompt={setInput}
								onRetry={retry}
								canRetry={canRetry}
							/>
							<ChatInputDA
								value={input}
								onChange={setInput}
								onSend={sendMessage}
								disabled={!selectedAgent || !chatConfig?.access.can_chat || streaming}
								streaming={streaming}
								stop={stop}
								token={token}
								sessionId={sessionId}
								agentId={selectedAgent?.id}
								capabilities={chatConfig?.capabilities}
								onFileUploaded={addPendingFile}
								onFileRemoved={removePendingFile}
							/>
						</>
					)}
				</main>
			)}
		</div>
	);
}

function DesktopChatHeader({
	selectedAgent,
	chatConfig,
	configLoading,
	configError,
	agentsError,
}: {
	selectedAgent: Agent | null;
	chatConfig: AgentChatConfig | null;
	configLoading: boolean;
	configError: string | null;
	agentsError: string | null;
}) {
	return (
		<header
			className="flex items-center gap-3 px-6 py-4"
			style={{ borderBottom: "1px solid #e8e4d8", background: "#faf9f5" }}
		>
			<div
				className="flex h-8 w-8 items-center justify-center"
				style={{ background: "#e8ede0", border: "1px solid #d0dac4" }}
			>
				<span
					style={{ fontFamily: "'DM Serif Display', serif", color: "#6b7c5c", fontSize: "0.9rem" }}
				>
					{selectedAgent?.name[0]?.toUpperCase() ?? "C"}
				</span>
			</div>
			<div className="min-w-0 flex-1">
				<p
					className="truncate text-sm font-medium"
					style={{ color: "#1e1c18", fontFamily: "'DM Sans', system-ui" }}
				>
					{selectedAgent?.name ?? "Claake Desktop"}
				</p>
				<p
					className="truncate text-xs"
					style={{ color: configError || agentsError ? "#c0392b" : "#a09a8a" }}
				>
					{configError ??
						agentsError ??
						selectedAgent?.description ??
						"Sélectionnez un agent pour démarrer."}
				</p>
			</div>
			{configLoading && <Loader2 className="h-4 w-4 animate-spin" style={{ color: "#a09a8a" }} />}
			{chatConfig?.provider && (
				<span
					className="border px-2 py-1 text-xs"
					style={{ borderColor: "#e8e4d8", color: "#766f62" }}
				>
					{chatConfig.provider} · {chatConfig.models[0] ?? "modèle par défaut"}
				</span>
			)}
		</header>
	);
}

function ConfigErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
	return (
		<div className="flex flex-1 items-center justify-center p-8" style={{ background: "#faf9f5" }}>
			<div className="max-w-md border p-6 text-center" style={{ borderColor: "#e8c4c4" }}>
				<AlertCircle className="mx-auto h-8 w-8" style={{ color: "#c0392b" }} />
				<h2 className="mt-4 text-xl" style={{ color: "#1e1c18" }}>
					Configuration du chat indisponible
				</h2>
				<p className="mt-2 text-sm" style={{ color: "#6b6558" }}>
					{error}
				</p>
				<button
					type="button"
					onClick={onRetry}
					className="mt-5 border px-4 py-3 text-sm font-medium"
					style={{ borderColor: "#2a7a44", color: "#2a7a44" }}
				>
					Réessayer
				</button>
			</div>
		</div>
	);
}

function AccessState({
	config,
	token,
	onOpenSettings,
	onRefresh,
}: {
	config: AgentChatConfig;
	token: string;
	onOpenSettings: (requiredProvider?: string | null) => void;
	onRefresh: () => Promise<void>;
}) {
	const [checkoutLoading, setCheckoutLoading] = useState(false);
	const [checkoutError, setCheckoutError] = useState<string | null>(null);

	async function openCheckout() {
		setCheckoutLoading(true);
		setCheckoutError(null);
		try {
			const { url } = await apiClient.payments.checkout(config.id, token);
			const checkoutUrl = new URL(url);
			if (checkoutUrl.protocol !== "https:" || checkoutUrl.hostname !== "checkout.stripe.com") {
				throw new Error("URL de paiement non autorisée.");
			}
			await openUrl(checkoutUrl.toString());
		} catch (error) {
			setCheckoutError(
				error instanceof Error ? error.message : "Impossible d'ouvrir le paiement sécurisé.",
			);
		} finally {
			setCheckoutLoading(false);
		}
	}

	const reasonLabel = {
		login_required: "Connexion requise.",
		api_key_required: `Cet agent nécessite une clé API ${config.access.required_provider ?? "provider"}.`,
		purchase_required: "Achat requis pour utiliser cet agent.",
		not_published: "Cet agent n'est pas publié.",
	}[config.access.reason ?? "not_published"];

	return (
		<div className="flex flex-1 items-center justify-center p-8" style={{ background: "#faf9f5" }}>
			<div
				className="max-w-md border p-6 text-center"
				style={{ borderColor: "#e8e4d8", background: "#f3f0e8" }}
			>
				<AlertCircle className="mx-auto h-8 w-8" style={{ color: "#c0392b" }} />
				<h2
					className="mt-4 text-xl"
					style={{ fontFamily: "'DM Serif Display', Georgia, serif", color: "#1e1c18" }}
				>
					Accès au chat indisponible
				</h2>
				<p className="mt-2 text-sm" style={{ color: "#6b6558" }}>
					{reasonLabel}
				</p>
				{checkoutError && (
					<p className="mt-3 text-sm" style={{ color: "#c0392b" }}>
						{checkoutError}
					</p>
				)}
				{config.access.reason === "purchase_required" && (
					<div className="mt-5 flex flex-col items-center gap-3">
						<button
							type="button"
							onClick={openCheckout}
							disabled={checkoutLoading}
							className="inline-flex items-center gap-2 border px-4 py-3 text-sm font-medium uppercase tracking-widest disabled:opacity-50"
							style={{ borderColor: "#2a7a44", color: "#2a7a44" }}
						>
							{checkoutLoading ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<ShoppingCart className="h-4 w-4" />
							)}
							Acheter cet agent
						</button>
						<button type="button" onClick={onRefresh} className="text-xs underline">
							J'ai terminé l'achat
						</button>
					</div>
				)}
				{config.access.reason === "api_key_required" && (
					<button
						type="button"
						onClick={() => onOpenSettings(config.access.required_provider)}
						className="mt-5 inline-flex items-center gap-2 border px-4 py-3 text-sm font-medium uppercase tracking-widest"
						style={{ borderColor: "#2a7a44", color: "#2a7a44" }}
					>
						<KeyRound className="h-4 w-4" /> Ajouter ma clé API
					</button>
				)}
			</div>
		</div>
	);
}
