"use client";

import { BUILDER_PROVIDER_OPTIONS, CLOUD_STRATEGIES, ENDPOINT_FORMATS } from "@claake/shared";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AgentBuilderForm, CloudStrategyValue, SetField } from "../agent-builder.types";

interface ExecutionStepProps {
	form: AgentBuilderForm;
	setField: SetField;
	disabled?: boolean;
	/** Affiche le champ clé API vendeur (création uniquement ; l'édition ne l'expose pas). */
	showSellerApiKey?: boolean;
}

/** Stratégie d'exécution : cloud (clé user/vendeur/endpoint) ou local (docker/download). */
export function ExecutionStep({
	form,
	setField,
	disabled = false,
	showSellerApiKey = false,
}: ExecutionStepProps) {
	const isCloud = form.mode !== "LOCAL";
	const isLocalCapable = form.mode === "LOCAL" || form.mode === "HYBRID";

	return (
		<div className="space-y-4">
			{isCloud && (
				<div className="space-y-2">
					<Label>Stratégie d&apos;exécution cloud</Label>
					<div className="grid grid-cols-3 gap-3">
						{CLOUD_STRATEGIES.map((s) => (
							<button
								key={s.id}
								type="button"
								onClick={() => !disabled && setField("cloudStrategy", s.id as CloudStrategyValue)}
								disabled={disabled}
								className={`rounded-md border p-3 text-left text-sm transition-colors disabled:opacity-50 ${
									form.cloudStrategy === s.id
										? "border-primary bg-primary/5"
										: "border-input hover:bg-accent"
								}`}
							>
								<div className="font-medium">{s.label}</div>
								<div className="mt-1 text-xs text-muted-foreground">{s.desc}</div>
							</button>
						))}
					</div>
				</div>
			)}

			{isCloud && form.cloudStrategy === "USER_API_KEY" && (
				<div className="space-y-2">
					<Label>Provider requis</Label>
					<select
						className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
						value={form.requiredUserProvider}
						onChange={(e) => setField("requiredUserProvider", e.target.value)}
						disabled={disabled}
					>
						{BUILDER_PROVIDER_OPTIONS.map((p) => (
							<option key={p.id} value={p.id}>
								{p.name}
							</option>
						))}
					</select>
				</div>
			)}

			{isCloud && form.cloudStrategy === "SELLER_ENDPOINT" && (
				<>
					<div className="space-y-2">
						<Label htmlFor="endpoint">URL de l&apos;endpoint</Label>
						<Input
							id="endpoint"
							value={form.endpoint}
							onChange={(e) => setField("endpoint", e.target.value)}
							placeholder="https://api.exemple.com/v1/chat"
							disabled={disabled}
						/>
					</div>
					<div className="space-y-2">
						<Label>Format de l&apos;API</Label>
						<select
							className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
							value={form.endpointFormat}
							onChange={(e) =>
								setField("endpointFormat", e.target.value as AgentBuilderForm["endpointFormat"])
							}
							disabled={disabled}
						>
							{ENDPOINT_FORMATS.map((f) => (
								<option key={f.id} value={f.id}>
									{f.label}
								</option>
							))}
						</select>
					</div>
				</>
			)}

			{isCloud && form.cloudStrategy === "SELLER_API_KEY" && (
				<>
					<div className="space-y-2">
						<Label>Provider</Label>
						<select
							className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
							value={form.sellerApiProvider}
							onChange={(e) => setField("sellerApiProvider", e.target.value)}
							disabled={disabled}
						>
							{BUILDER_PROVIDER_OPTIONS.map((p) => (
								<option key={p.id} value={p.id}>
									{p.name}
								</option>
							))}
						</select>
					</div>
					{showSellerApiKey && (
						<div className="space-y-2">
							<Label htmlFor="sellerApiKey">Clé API vendeur</Label>
							<Input
								id="sellerApiKey"
								type="password"
								value={form.sellerApiKey}
								onChange={(e) => setField("sellerApiKey", e.target.value)}
								placeholder="sk-..."
								disabled={disabled}
							/>
							<p className="text-xs text-muted-foreground">
								Stockée chiffrée — jamais exposée aux utilisateurs.
							</p>
						</div>
					)}
				</>
			)}

			{isLocalCapable && (
				<div className="grid gap-4 sm:grid-cols-2">
					<div className="space-y-2">
						<Label htmlFor="dockerImage">Image Docker</Label>
						<Input
							id="dockerImage"
							value={form.dockerImage}
							onChange={(e) => setField("dockerImage", e.target.value)}
							placeholder="ghcr.io/moncompte/mon-agent:latest"
							disabled={disabled}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="downloadUrl">URL de téléchargement (optionnel)</Label>
						<Input
							id="downloadUrl"
							value={form.downloadUrl}
							onChange={(e) => setField("downloadUrl", e.target.value)}
							placeholder="https://releases.exemple.com/agent-v1.0.zip"
							disabled={disabled}
						/>
					</div>
				</div>
			)}
		</div>
	);
}
