"use client";

import type { Agent, AgentCategory } from "@claake/shared";
import { AI_MODELS, EXECUTION_MODES } from "@claake/shared";
import { AlertCircle, ArrowLeft, Check, ImagePlus, Loader2, Save, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { FileUploader } from "@/components/uploads";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/lib/hooks/use-auth";
import { uploadAgentImage } from "@/lib/supabase/storage";

const statusLabels: Record<
	string,
	{ label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
	draft: { label: "Brouillon", variant: "secondary" },
	pending: { label: "En attente", variant: "outline" },
	approved: { label: "Publié", variant: "default" },
	rejected: { label: "Rejeté", variant: "destructive" },
	suspended: { label: "Suspendu", variant: "destructive" },
};

export default function EditAgentPage() {
	const { id } = useParams<{ id: string }>();
	const { token } = useAuth();
	const imageInputRef = useRef<HTMLInputElement>(null);
	const [agent, setAgent] = useState<Agent | null>(null);
	const [categories, setCategories] = useState<AgentCategory[]>([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);

	const [formData, setFormData] = useState({
		name: "",
		description: "",
		longDescription: "",
		category: "",
		tags: "",
		model: "claude-sonnet-4-20250514",
		mode: "CLOUD" as "LOCAL" | "CLOUD" | "HYBRID",
		cloudStrategy: "USER_API_KEY" as "USER_API_KEY" | "SELLER_API_KEY" | "SELLER_ENDPOINT",
		requiredUserProvider: "anthropic",
		systemPrompt: "",
		endpoint: "",
		endpointFormat: "OPENAI" as
			| "OPENAI"
			| "ANTHROPIC"
			| "GOOGLE"
			| "MISTRAL"
			| "GROQ"
			| "HUGGINGFACE"
			| "CLAAKE",
		sellerApiProvider: "anthropic",
		dockerImage: "",
		downloadUrl: "",
	});

	useEffect(() => {
		Promise.all([apiClient.agents.get(id), apiClient.categories.list()])
			.then(([agentData, cats]) => {
				setAgent(agentData);
				setCategories(cats);
				setFormData({
					name: agentData.name,
					description: agentData.description,
					longDescription: agentData.long_description ?? "",
					category: agentData.category,
					tags: agentData.tags.join(", "),
					model: agentData.models[0] ?? "claude-sonnet-4-20250514",
					mode: agentData.mode.toUpperCase() as "LOCAL" | "CLOUD" | "HYBRID",
					cloudStrategy: (agentData.cloud_strategy?.toUpperCase() ?? "USER_API_KEY") as
						| "USER_API_KEY"
						| "SELLER_API_KEY"
						| "SELLER_ENDPOINT",
					requiredUserProvider: agentData.required_user_provider ?? "anthropic",
					systemPrompt: agentData.system_prompt ?? "",
					endpoint: "",
					endpointFormat: (agentData.endpoint_format?.toUpperCase() ?? "OPENAI") as any,
					sellerApiProvider: "anthropic",
					dockerImage: agentData.docker_image ?? "",
					downloadUrl: agentData.download_url ?? "",
				});
				if (agentData.image_url) {
					setImagePreview(agentData.image_url);
				}
			})
			.catch(() => setError("Impossible de charger l'agent."))
			.finally(() => setLoading(false));
	}, [id]);

	function updateField(field: string, value: string) {
		setFormData((prev) => ({ ...prev, [field]: value }));
		setSuccess(false);
	}

	function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;
		if (!file.type.startsWith("image/")) {
			setError("Le fichier doit être une image.");
			return;
		}
		if (file.size > 2 * 1024 * 1024) {
			setError("L'image ne doit pas dépasser 2 Mo.");
			return;
		}
		setImageFile(file);
		setImagePreview(URL.createObjectURL(file));
		setError(null);
		setSuccess(false);
	}

	function removeImage() {
		setImageFile(null);
		if (imagePreview && !agent?.image_url) {
			URL.revokeObjectURL(imagePreview);
		}
		setImagePreview(null);
		setSuccess(false);
	}

	async function handleSave() {
		if (!token || !agent) return;

		setSaving(true);
		setError(null);
		setSuccess(false);

		try {
			let imageUrl: string | undefined;
			if (imageFile) {
				imageUrl = await uploadAgentImage(imageFile, agent.slug);
			}

			await apiClient.agents.update(
				agent.id,
				{
					name: formData.name,
					description: formData.description,
					long_description: formData.longDescription || undefined,
					category: formData.category,
					tags: formData.tags
						.split(",")
						.map((t) => t.trim())
						.filter(Boolean),
					models: [formData.model],
					mode: formData.mode,
					image_url: imageUrl ?? undefined,
					system_prompt: formData.systemPrompt || undefined,
					cloud_strategy: formData.mode !== "LOCAL" ? formData.cloudStrategy : undefined,
					required_user_provider:
						formData.cloudStrategy === "USER_API_KEY" ? formData.requiredUserProvider : undefined,
					endpoint_format:
						formData.cloudStrategy === "SELLER_ENDPOINT" ? formData.endpointFormat : undefined,
					docker_image:
						formData.mode === "LOCAL" || formData.mode === "HYBRID"
							? formData.dockerImage || undefined
							: undefined,
					download_url:
						formData.mode === "LOCAL" || formData.mode === "HYBRID"
							? formData.downloadUrl || undefined
							: undefined,
				} as any,
				token,
			);

			setSuccess(true);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erreur lors de la sauvegarde.");
		} finally {
			setSaving(false);
		}
	}

	if (loading) {
		return (
			<div className="flex justify-center py-16">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (!agent) {
		return (
			<div className="py-16 text-center">
				<p className="text-muted-foreground">Agent introuvable.</p>
				<Button variant="outline" className="mt-4" asChild>
					<Link href="/dashboard/agents">Retour</Link>
				</Button>
			</div>
		);
	}

	const isEditable = agent.status === "draft" || agent.status === "rejected";
	const status = statusLabels[agent.status] ?? statusLabels.draft;

	return (
		<div>
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="sm" asChild>
					<Link href="/dashboard/agents">
						<ArrowLeft className="mr-1 h-4 w-4" />
						Retour
					</Link>
				</Button>
				<div className="flex-1">
					<h1 className="text-3xl font-bold">Modifier l&apos;agent</h1>
					<div className="mt-1 flex items-center gap-2">
						<Badge variant={status.variant}>{status.label}</Badge>
						{!isEditable && (
							<span className="text-sm text-muted-foreground">(non modifiable dans cet état)</span>
						)}
					</div>
				</div>
			</div>

			{error && (
				<div className="mt-4 flex items-center gap-2 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
					<AlertCircle className="h-4 w-4 shrink-0" />
					{error}
				</div>
			)}

			{success && (
				<div className="mt-4 flex items-center gap-2 rounded-md border border-green-500/50 bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
					<Check className="h-4 w-4 shrink-0" />
					Agent mis à jour avec succès.
				</div>
			)}

			<Card className="mt-6">
				<CardContent className="space-y-6 p-6">
					{/* Image */}
					<div className="space-y-2">
						<Label>Icône de l&apos;agent</Label>
						<div className="flex items-center gap-4">
							{imagePreview ? (
								<div className="relative">
									<Image
										src={imagePreview}
										alt="Agent icon"
										width={80}
										height={80}
										className="rounded-lg border object-cover"
									/>
									{isEditable && (
										<button
											type="button"
											onClick={removeImage}
											className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
										>
											<X className="h-3 w-3" />
										</button>
									)}
								</div>
							) : (
								<button
									type="button"
									onClick={() => imageInputRef.current?.click()}
									disabled={!isEditable}
									className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed transition-colors hover:bg-muted/50 disabled:opacity-50"
								>
									<ImagePlus className="h-6 w-6 text-muted-foreground" />
								</button>
							)}
							{isEditable && !imagePreview && (
								<Button variant="outline" size="sm" onClick={() => imageInputRef.current?.click()}>
									Choisir une image
								</Button>
							)}
							<input
								ref={imageInputRef}
								type="file"
								accept="image/png,image/jpeg,image/webp"
								onChange={handleImageSelect}
								className="hidden"
							/>
						</div>
					</div>

					<Separator />

					{/* Name + Description */}
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="name">Nom</Label>
							<Input
								id="name"
								value={formData.name}
								onChange={(e) => updateField("name", e.target.value)}
								disabled={!isEditable}
							/>
						</div>
						<div className="space-y-2">
							<Label>Catégorie</Label>
							<select
								className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
								value={formData.category}
								onChange={(e) => updateField("category", e.target.value)}
								disabled={!isEditable}
							>
								<option value="">Sélectionner</option>
								{categories.map((cat) => (
									<option key={cat.id} value={cat.slug}>
										{cat.name}
									</option>
								))}
							</select>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="description">Description courte</Label>
						<Input
							id="description"
							value={formData.description}
							onChange={(e) => updateField("description", e.target.value)}
							disabled={!isEditable}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="longDescription">Description détaillée</Label>
						<Textarea
							id="longDescription"
							value={formData.longDescription}
							onChange={(e) => updateField("longDescription", e.target.value)}
							rows={4}
							disabled={!isEditable}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="tags">Tags</Label>
						<Input
							id="tags"
							value={formData.tags}
							onChange={(e) => updateField("tags", e.target.value)}
							placeholder="code, review, qualité"
							disabled={!isEditable}
						/>
					</div>

					<Separator />

					{/* Configuration */}
					<div className="space-y-4">
						<h3 className="text-lg font-semibold">Configuration</h3>

						<div className="grid gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<Label>Modèle IA</Label>
								<select
									className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
									value={formData.model}
									onChange={(e) => updateField("model", e.target.value)}
									disabled={!isEditable}
								>
									{AI_MODELS.map((m) => (
										<option key={m.id} value={m.id}>
											{m.name}
										</option>
									))}
								</select>
							</div>
							<div className="space-y-2">
								<Label>Mode</Label>
								<div className="grid grid-cols-3 gap-2">
									{EXECUTION_MODES.map((m) => (
										<button
											key={m.id}
											type="button"
											onClick={() => isEditable && updateField("mode", m.id.toUpperCase())}
											disabled={!isEditable}
											className={`rounded-md border p-2 text-center text-sm transition-colors disabled:opacity-50 ${
												formData.mode === m.id.toUpperCase()
													? "border-primary bg-primary/5"
													: "border-input"
											}`}
										>
											{m.name}
										</button>
									))}
								</div>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="systemPrompt">System Prompt</Label>
							<Textarea
								id="systemPrompt"
								value={formData.systemPrompt}
								onChange={(e) => updateField("systemPrompt", e.target.value)}
								rows={6}
								disabled={!isEditable}
							/>
						</div>

						{formData.mode !== "LOCAL" && (
							<div className="space-y-2">
								<Label>Stratégie cloud</Label>
								<div className="grid grid-cols-3 gap-2">
									{[
										{
											id: "USER_API_KEY",
											label: "Clé utilisateur",
										},
										{
											id: "SELLER_API_KEY",
											label: "Clé vendeur",
										},
										{
											id: "SELLER_ENDPOINT",
											label: "Endpoint",
										},
									].map((s) => (
										<button
											key={s.id}
											type="button"
											onClick={() => isEditable && updateField("cloudStrategy", s.id)}
											disabled={!isEditable}
											className={`rounded-md border p-2 text-center text-sm transition-colors disabled:opacity-50 ${
												formData.cloudStrategy === s.id
													? "border-primary bg-primary/5"
													: "border-input"
											}`}
										>
											{s.label}
										</button>
									))}
								</div>
							</div>
						)}

						{(formData.mode === "LOCAL" || formData.mode === "HYBRID") && (
							<div className="grid gap-4 sm:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="dockerImage">Image Docker</Label>
									<Input
										id="dockerImage"
										value={formData.dockerImage}
										onChange={(e) => updateField("dockerImage", e.target.value)}
										disabled={!isEditable}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="downloadUrl">URL de téléchargement</Label>
									<Input
										id="downloadUrl"
										value={formData.downloadUrl}
										onChange={(e) => updateField("downloadUrl", e.target.value)}
										disabled={!isEditable}
									/>
								</div>
							</div>
						)}
					</div>

					{/* Médias & Documents */}
					<Separator />
					<div className="space-y-4">
						<h3 className="text-lg font-semibold">Médias &amp; Documents</h3>
						{token && (
							<FileUploader
								token={token}
								agentId={id}
							/>
						)}
					</div>

					{/* Actions */}
					<Separator />
					<div className="flex justify-between">
						<Button variant="outline" asChild>
							<Link href="/dashboard/agents">Annuler</Link>
						</Button>
						{isEditable && (
							<Button onClick={handleSave} disabled={saving}>
								{saving ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : (
									<Save className="mr-2 h-4 w-4" />
								)}
								{saving ? "Sauvegarde..." : "Sauvegarder"}
							</Button>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
