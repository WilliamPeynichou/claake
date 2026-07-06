import { useApiKeys } from "@claake/shared/hooks";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { apiClient } from "@/lib/api";

interface ApiKeysPanelProps {
	token: string;
	requiredProvider?: string | null;
	onBackToChat: () => void;
}

const providerOptions = [
	{ value: "anthropic", label: "Anthropic / Claude" },
	{ value: "openai", label: "OpenAI / GPT" },
	{ value: "mistral", label: "Mistral" },
	{ value: "google", label: "Google / Gemini" },
];

export function ApiKeysPanel({ token, requiredProvider, onBackToChat }: ApiKeysPanelProps) {
	const { keys, loading, addKey, removeKey } = useApiKeys(apiClient, token);
	const [provider, setProvider] = useState(requiredProvider ?? "anthropic");
	const [label, setLabel] = useState("");
	const [key, setKey] = useState("");
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleSubmit(event: FormEvent) {
		event.preventDefault();
		setError(null);
		setSaving(true);
		try {
			await addKey(
				provider,
				label.trim() || providerOptions.find((p) => p.value === provider)?.label || provider,
				key,
			);
			setLabel("");
			setKey("");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Impossible d'ajouter la clé API.");
		} finally {
			setSaving(false);
		}
	}

	async function handleRemove(keyId: string) {
		setError(null);
		try {
			await removeKey(keyId);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Impossible de supprimer la clé API.");
		}
	}

	return (
		<main className="flex min-w-0 flex-1 flex-col" style={{ background: "#faf9f5" }}>
			<header className="px-8 py-6" style={{ borderBottom: "1px solid #e8e4d8" }}>
				<p className="text-xs font-medium uppercase tracking-widest" style={{ color: "#766f62" }}>
					Paramètres
				</p>
				<h1
					className="mt-2 text-3xl"
					style={{ fontFamily: "'DM Serif Display', Georgia, serif", color: "#1e1c18" }}
				>
					Clés API utilisateur
				</h1>
				<p className="mt-2 max-w-2xl text-sm" style={{ color: "#6b6558" }}>
					Ajoutez vos clés provider pour utiliser les agents configurés en stratégie clé API
					utilisateur. Les clés sont stockées chiffrées côté backend Claake.
				</p>
			</header>

			<div className="grid flex-1 gap-6 overflow-y-auto p-8 lg:grid-cols-[minmax(0,1fr)_360px]">
				<section className="space-y-3">
					<div className="flex items-center justify-between">
						<h2
							className="text-sm font-medium uppercase tracking-widest"
							style={{ color: "#766f62" }}
						>
							Clés enregistrées
						</h2>
						<button
							type="button"
							onClick={onBackToChat}
							className="text-sm"
							style={{ color: "#2a7a44" }}
						>
							Retour au chat
						</button>
					</div>

					{loading ? (
						<div className="flex items-center gap-2 py-6 text-sm" style={{ color: "#766f62" }}>
							<Loader2 className="h-4 w-4 animate-spin" /> Chargement…
						</div>
					) : keys.length === 0 ? (
						<div
							className="border p-6 text-sm"
							style={{ borderColor: "#e8e4d8", color: "#766f62" }}
						>
							Aucune clé API enregistrée.
						</div>
					) : (
						<div className="space-y-2">
							{keys.map((apiKey) => (
								<div
									key={apiKey.id}
									className="flex items-center justify-between border p-4"
									style={{ borderColor: "#e8e4d8", background: "#f3f0e8" }}
								>
									<div>
										<p className="text-sm font-medium" style={{ color: "#1e1c18" }}>
											{apiKey.label}
										</p>
										<p className="text-xs" style={{ color: "#766f62" }}>
											{apiKey.provider} · {apiKey.key_preview}
										</p>
									</div>
									<button
										type="button"
										onClick={() => handleRemove(apiKey.id)}
										className="p-2"
										style={{ color: "#c0392b" }}
										aria-label={`Supprimer ${apiKey.label}`}
									>
										<Trash2 className="h-4 w-4" />
									</button>
								</div>
							))}
						</div>
					)}
				</section>

				<form
					onSubmit={handleSubmit}
					className="h-fit space-y-4 border p-5"
					style={{ borderColor: "#e8e4d8", background: "#f3f0e8" }}
				>
					<h2
						className="text-sm font-medium uppercase tracking-widest"
						style={{ color: "#766f62" }}
					>
						Ajouter une clé
					</h2>
					{requiredProvider && (
						<p className="border p-3 text-xs" style={{ borderColor: "#d0dac4", color: "#6b7c5c" }}>
							L'agent sélectionné demande une clé {requiredProvider}.
						</p>
					)}
					{error && (
						<p className="border p-3 text-xs" style={{ borderColor: "#e8c4c4", color: "#c0392b" }}>
							{error}
						</p>
					)}
					<div className="space-y-2">
						<label
							className="text-xs font-medium uppercase tracking-widest"
							style={{ color: "#766f62" }}
							htmlFor="provider"
						>
							Provider
						</label>
						<select
							id="provider"
							value={provider}
							onChange={(event) => setProvider(event.target.value)}
							className="w-full border px-3 py-3 text-sm outline-none"
							style={{ background: "#faf9f5", borderColor: "#e8e4d8", color: "#1e1c18" }}
						>
							{providerOptions.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</div>
					<div className="space-y-2">
						<label
							className="text-xs font-medium uppercase tracking-widest"
							style={{ color: "#766f62" }}
							htmlFor="label"
						>
							Label
						</label>
						<input
							id="label"
							value={label}
							onChange={(event) => setLabel(event.target.value)}
							placeholder="Ma clé personnelle"
							className="w-full border px-3 py-3 text-sm outline-none"
							style={{ background: "#faf9f5", borderColor: "#e8e4d8", color: "#1e1c18" }}
						/>
					</div>
					<div className="space-y-2">
						<label
							className="text-xs font-medium uppercase tracking-widest"
							style={{ color: "#766f62" }}
							htmlFor="apiKey"
						>
							Clé API
						</label>
						<input
							id="apiKey"
							value={key}
							onChange={(event) => setKey(event.target.value)}
							type="password"
							required
							placeholder="sk-..."
							className="w-full border px-3 py-3 text-sm outline-none"
							style={{ background: "#faf9f5", borderColor: "#e8e4d8", color: "#1e1c18" }}
						/>
					</div>
					<button
						type="submit"
						disabled={saving}
						className="flex w-full items-center justify-center gap-2 border px-4 py-3 text-sm font-medium uppercase tracking-widest disabled:opacity-60"
						style={{ borderColor: "#2a7a44", background: "#2a7a44", color: "#faf9f5" }}
					>
						{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
						Ajouter
					</button>
				</form>
			</div>
		</main>
	);
}
