"use client";

import type { AgentCategory, CreateAgentInput, ValidationResult } from "@claake/shared";
import { AI_MODELS, EXECUTION_MODES } from "@claake/shared";
import { AlertCircle, ArrowLeft, ArrowRight, Check, ImagePlus, Upload, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/lib/hooks/use-auth";
import { uploadAgentConfigFile, uploadAgentImage } from "@/lib/supabase/storage";

const steps = ["Fichier .agentjson", "Métadonnées", "Configuration", "Tarification", "Validation"];

const INITIAL_FORM = {
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
	sellerApiKey: "",
	sellerApiProvider: "anthropic",
	dockerImage: "",
	downloadUrl: "",
	priceType: "free",
	price: "0",
};

export default function NewAgentPage() {
	const router = useRouter();
	const { token, user } = useAuth();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const imageInputRef = useRef<HTMLInputElement>(null);
	const [categories, setCategories] = useState<AgentCategory[]>([]);
	const [currentStep, setCurrentStep] = useState(0);
	const [submitting, setSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [submitWarnings, setSubmitWarnings] = useState<string[]>([]);
	const [validation, setValidation] = useState<ValidationResult | null>(null);
	const [backendError, setBackendError] = useState<string | null>(null);
	const [formData, setFormData] = useState(INITIAL_FORM);
	const [submitted, setSubmitted] = useState(false);

	// File states
	const [agentJsonFile, setAgentJsonFile] = useState<File | null>(null);
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const [dropDragOver, setDropDragOver] = useState(false);

	useEffect(() => {
		apiClient.categories
			.list()
			.then(setCategories)
			.catch(() => {
				setBackendError(
					"Impossible de contacter le serveur. Vérifiez que le backend est démarré (npm run api).",
				);
			});
	}, []);

	function updateField(field: string, value: string) {
		setFormData((prev) => ({ ...prev, [field]: value }));
	}

	async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;

		try {
			const text = await file.text();
			const parsed = JSON.parse(text);

			setAgentJsonFile(file);

			setFormData((prev) => ({
				...prev,
				name: parsed.name ?? prev.name,
				description: parsed.description ?? prev.description,
				longDescription: parsed.long_description ?? parsed.longDescription ?? prev.longDescription,
				category: parsed.category ?? prev.category,
				tags: Array.isArray(parsed.tags) ? parsed.tags.join(", ") : prev.tags,
				model: parsed.model ?? parsed.models?.[0] ?? prev.model,
				mode: (parsed.mode?.toUpperCase() ?? prev.mode) as "LOCAL" | "CLOUD" | "HYBRID",
				cloudStrategy: parsed.cloud_strategy ?? prev.cloudStrategy,
				requiredUserProvider: parsed.required_user_provider ?? prev.requiredUserProvider,
				systemPrompt: parsed.system_prompt ?? parsed.systemPrompt ?? prev.systemPrompt,
				endpoint: parsed.endpoint ?? parsed.config_url ?? prev.endpoint,
				endpointFormat: parsed.endpoint_format ?? prev.endpointFormat,
				sellerApiProvider: parsed.seller_api_provider ?? prev.sellerApiProvider,
				dockerImage: parsed.docker_image ?? prev.dockerImage,
				downloadUrl: parsed.download_url ?? prev.downloadUrl,
			}));

			setCurrentStep(1);
		} catch {
			setSubmitError("Fichier .agentjson invalide.");
		}
	}

	function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;

		if (!file.type.startsWith("image/")) {
			setSubmitError("Le fichier doit être une image (PNG, JPG, WebP).");
			return;
		}

		if (file.size > 2 * 1024 * 1024) {
			setSubmitError("L'image ne doit pas dépasser 2 Mo.");
			return;
		}

		setImageFile(file);
		setImagePreview(URL.createObjectURL(file));
		setSubmitError(null);
	}

	function removeImage() {
		setImageFile(null);
		if (imagePreview) {
			URL.revokeObjectURL(imagePreview);
			setImagePreview(null);
		}
	}

	function canAdvance(): boolean {
		switch (currentStep) {
			case 1:
				return !!(formData.name && formData.description && formData.category);
			case 2: {
				const isCloud = formData.mode !== "LOCAL";
				const isLocal = formData.mode === "LOCAL" || formData.mode === "HYBRID";
				if (isCloud && formData.cloudStrategy === "SELLER_ENDPOINT" && !formData.endpoint)
					return false;
				if (isCloud && formData.cloudStrategy === "SELLER_API_KEY" && !formData.sellerApiKey)
					return false;
				if (isLocal && !formData.dockerImage && !formData.downloadUrl) return false;
				return true;
			}
			default:
				return true;
		}
	}

	async function handleSubmit() {
		if (!token || !user) {
			setSubmitError("Vous devez être connecté.");
			return;
		}

		if (!formData.name || !formData.description || !formData.category) {
			setSubmitError("Veuillez remplir les champs obligatoires (nom, description, catégorie).");
			return;
		}

		setSubmitting(true);
		setSubmitError(null);
		setSubmitWarnings([]);

		try {
			const slug = formData.name
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, "-")
				.replace(/^-|-$/g, "");

			const warnings: string[] = [];

			// Upload image if provided
			let imageUrl: string | undefined;
			if (imageFile) {
				try {
					imageUrl = await uploadAgentImage(imageFile, slug, user.id);
				} catch (err) {
					warnings.push(
						`L'icône n'a pas pu être uploadée : ${err instanceof Error ? err.message : "erreur inconnue"}`,
					);
				}
			}

			// Upload .agentjson file if provided
			let configUrl: string | undefined;
			if (agentJsonFile) {
				try {
					configUrl = await uploadAgentConfigFile(agentJsonFile, slug, user.id);
				} catch (err) {
					warnings.push(
						`Le fichier .agentjson n'a pas pu être uploadé : ${err instanceof Error ? err.message : "erreur inconnue"}`,
					);
				}
			}

			const payload: CreateAgentInput = {
				name: formData.name,
				slug,
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
				cloud_strategy: formData.mode !== "LOCAL" ? formData.cloudStrategy : undefined,
				required_user_provider:
					formData.cloudStrategy === "USER_API_KEY" ? formData.requiredUserProvider : undefined,
				endpoint_url:
					formData.cloudStrategy === "SELLER_ENDPOINT"
						? formData.endpoint || undefined
						: undefined,
				endpoint_format:
					formData.cloudStrategy === "SELLER_ENDPOINT" ? formData.endpointFormat : undefined,
				seller_api_key:
					formData.cloudStrategy === "SELLER_API_KEY"
						? formData.sellerApiKey || undefined
						: undefined,
				seller_api_provider:
					formData.cloudStrategy === "SELLER_API_KEY"
						? formData.sellerApiProvider || undefined
						: undefined,
				docker_image:
					formData.mode === "LOCAL" || formData.mode === "HYBRID"
						? formData.dockerImage || undefined
						: undefined,
				download_url:
					formData.mode === "LOCAL" || formData.mode === "HYBRID"
						? formData.downloadUrl || undefined
						: undefined,
				config_url: configUrl || undefined,
				system_prompt: formData.systemPrompt || undefined,
				pricing_model: "FREE",
			};

			const result = await apiClient.agents.create(payload, token);

			setValidation(result.validation);
			setSubmitWarnings(warnings);
			setSubmitted(true);
		} catch (err) {
			setSubmitError(err instanceof Error ? err.message : "Erreur lors de la soumission.");
		} finally {
			setSubmitting(false);
		}
	}

	if (submitted) {
		return (
			<div className="flex flex-col items-center justify-center py-16 text-center">
				<div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
					<Check className="h-8 w-8 text-green-600 dark:text-green-400" />
				</div>
				<h2 className="mt-6 text-2xl font-bold">Agent soumis avec succès</h2>
				<p className="mt-2 max-w-md text-muted-foreground">
					Votre agent <strong>{formData.name}</strong> a été soumis pour validation. Vous recevrez
					une notification une fois la revue terminée.
				</p>

				{submitWarnings.length > 0 && (
					<div className="mt-4 w-full max-w-md rounded-md border border-orange-500/50 bg-orange-50 p-3 text-left dark:bg-orange-900/20">
						<p className="mb-1 text-sm font-medium text-orange-700 dark:text-orange-400">
							Avertissements d&apos;upload
						</p>
						{submitWarnings.map((w) => (
							<p key={w} className="flex items-start gap-1 text-sm text-orange-600 dark:text-orange-300">
								<AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
								{w}
							</p>
						))}
					</div>
				)}

				{validation && (
					<div className="mt-6 w-full max-w-md text-left">
						{validation.errors.length > 0 && (
							<div className="mb-3 rounded-md border border-destructive/50 bg-destructive/10 p-3">
								<p className="mb-1 text-sm font-medium text-destructive">Erreurs</p>
								{validation.errors.map((err) => (
									<p key={err} className="flex items-start gap-1 text-sm text-destructive">
										<AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
										{err}
									</p>
								))}
							</div>
						)}
						{validation.warnings.length > 0 && (
							<div className="rounded-md border border-yellow-500/50 bg-yellow-50 p-3 dark:bg-yellow-900/20">
								<p className="mb-1 text-sm font-medium text-yellow-700 dark:text-yellow-400">
									Avertissements
								</p>
								{validation.warnings.map((w) => (
									<p key={w} className="text-sm text-yellow-600 dark:text-yellow-300">
										{w}
									</p>
								))}
							</div>
						)}
						{validation.valid && validation.warnings.length === 0 && (
							<div className="rounded-md border border-green-500/50 bg-green-50 p-3 dark:bg-green-900/20">
								<p className="text-sm text-green-700 dark:text-green-400">
									Validation automatique réussie. Votre agent est en attente de publication.
								</p>
							</div>
						)}
					</div>
				)}

				<div className="mt-8 flex gap-4">
					<Button variant="outline" onClick={() => router.push("/dashboard/agents")}>
						Voir mes agents
					</Button>
					<Button
						onClick={() => {
							setSubmitted(false);
							setValidation(null);
							setSubmitWarnings([]);
							setCurrentStep(0);
							setFormData(INITIAL_FORM);
							setAgentJsonFile(null);
							removeImage();
						}}
					>
						Publier un autre agent
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div>
			<h1 className="text-3xl font-bold">Publier un agent</h1>
			<p className="mt-2 text-muted-foreground">Créez et publiez un nouvel agent IA en 5 étapes.</p>

			{backendError && (
				<div className="mt-4 flex items-center gap-2 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
					<AlertCircle className="h-4 w-4 shrink-0" />
					{backendError}
				</div>
			)}

			{/* Step indicator */}
			<div className="mt-8 flex items-center gap-2">
				{steps.map((step, i) => (
					<div key={step} className="flex items-center gap-2">
						<button
							type="button"
							onClick={() => setCurrentStep(i)}
							className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors ${
								i === currentStep
									? "bg-primary text-primary-foreground"
									: i < currentStep
										? "bg-primary/20 text-primary"
										: "bg-muted text-muted-foreground"
							}`}
						>
							{i < currentStep ? <Check className="h-4 w-4" /> : i + 1}
						</button>
						<span
							className={`hidden text-sm sm:inline ${
								i === currentStep ? "font-medium" : "text-muted-foreground"
							}`}
						>
							{step}
						</span>
						{i < steps.length - 1 && <Separator className="w-4 sm:w-8" />}
					</div>
				))}
			</div>

			<Card className="mt-8">
				<CardContent className="p-6">
					{/* Step 0: File upload */}
					{currentStep === 0 && (
						<div className="space-y-4">
							<div>
								<h3 className="text-lg font-semibold">Fichier .agentjson</h3>
								<p className="text-sm text-muted-foreground">
									Uploadez votre fichier de définition d&apos;agent ou créez-en un manuellement.
								</p>
							</div>
							<div
								className={`flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors ${
									dropDragOver
										? "border-primary bg-primary/5"
										: "hover:bg-muted/50"
								}`}
								onClick={() => fileInputRef.current?.click()}
								onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
								onDragOver={(e) => { e.preventDefault(); setDropDragOver(true); }}
								onDragLeave={() => setDropDragOver(false)}
								onDrop={(e) => {
									e.preventDefault();
									setDropDragOver(false);
									const file = e.dataTransfer.files?.[0];
									if (file) {
										const syntheticEvent = { target: { files: e.dataTransfer.files } } as unknown as React.ChangeEvent<HTMLInputElement>;
										handleFileUpload(syntheticEvent);
									}
								}}
								role="button"
								tabIndex={0}
							>
								<div className="text-center">
									<Upload className="mx-auto h-8 w-8 text-muted-foreground" />
									<p className="mt-2 text-sm font-medium">Glissez votre fichier .agentjson ici</p>
									<p className="text-xs text-muted-foreground">ou cliquez pour sélectionner</p>
									<input
										ref={fileInputRef}
										type="file"
										accept=".agentjson,.json"
										onChange={handleFileUpload}
										className="hidden"
									/>
									{agentJsonFile && (
										<p className="mt-2 text-sm text-green-600">{agentJsonFile.name}</p>
									)}
									<Button
										variant="outline"
										size="sm"
										className="mt-4"
										onClick={(e) => {
											e.stopPropagation();
											fileInputRef.current?.click();
										}}
									>
										Sélectionner un fichier
									</Button>
								</div>
							</div>
							{submitError && <p className="text-sm text-destructive">{submitError}</p>}
							<Separator />
							<p className="text-center text-sm text-muted-foreground">
								Pas de fichier ? Remplissez les informations manuellement à l&apos;étape suivante.
							</p>
						</div>
					)}

					{/* Step 1: Metadata */}
					{currentStep === 1 && (
						<div className="space-y-4">
							<h3 className="text-lg font-semibold">Métadonnées</h3>

							{/* Image upload */}
							<div className="space-y-2">
								<Label>Icône de l&apos;agent</Label>
								<div className="flex items-center gap-4">
									{imagePreview ? (
										<div className="relative">
											<Image
												src={imagePreview}
												alt="Agent icon preview"
												width={80}
												height={80}
												className="rounded-lg border object-cover"
											/>
											<button
												type="button"
												onClick={removeImage}
												className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
											>
												<X className="h-3 w-3" />
											</button>
										</div>
									) : (
										<button
											type="button"
											onClick={() => imageInputRef.current?.click()}
											className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed transition-colors hover:bg-muted/50"
										>
											<ImagePlus className="h-6 w-6 text-muted-foreground" />
										</button>
									)}
									<div className="text-sm text-muted-foreground">
										<p>PNG, JPG ou WebP. Max 2 Mo.</p>
										{!imagePreview && (
											<Button
												variant="outline"
												size="sm"
												className="mt-1"
												onClick={() => imageInputRef.current?.click()}
											>
												Choisir une image
											</Button>
										)}
									</div>
									<input
										ref={imageInputRef}
										type="file"
										accept="image/png,image/jpeg,image/webp"
										onChange={handleImageSelect}
										className="hidden"
									/>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="name">
									Nom de l&apos;agent <span className="text-destructive">*</span>
								</Label>
								<Input
									id="name"
									value={formData.name}
									onChange={(e) => updateField("name", e.target.value)}
									placeholder="ex: CodeReview Pro"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="description">
									Description courte <span className="text-destructive">*</span>
								</Label>
								<Input
									id="description"
									value={formData.description}
									onChange={(e) => updateField("description", e.target.value)}
									placeholder="Une phrase décrivant votre agent"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="longDescription">Description détaillée</Label>
								<Textarea
									id="longDescription"
									value={formData.longDescription}
									onChange={(e) => updateField("longDescription", e.target.value)}
									placeholder="Description complète de votre agent..."
									rows={5}
								/>
							</div>
							<div className="space-y-2">
								<Label>
									Catégorie <span className="text-destructive">*</span>
								</Label>
								<select
									className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
									value={formData.category}
									onChange={(e) => updateField("category", e.target.value)}
								>
									<option value="">Sélectionner une catégorie</option>
									{categories.map((cat) => (
										<option key={cat.id} value={cat.slug}>
											{cat.name}
										</option>
									))}
								</select>
							</div>
							<div className="space-y-2">
								<Label htmlFor="tags">Tags (séparés par des virgules)</Label>
								<Input
									id="tags"
									value={formData.tags}
									onChange={(e) => updateField("tags", e.target.value)}
									placeholder="code, review, qualité"
								/>
							</div>
						</div>
					)}

					{/* Step 2: Configuration */}
					{currentStep === 2 && (
						<div className="space-y-4">
							<h3 className="text-lg font-semibold">Configuration</h3>
							<div className="space-y-2">
								<Label>Modèle IA</Label>
								<select
									className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
									value={formData.model}
									onChange={(e) => updateField("model", e.target.value)}
								>
									{AI_MODELS.map((m) => (
										<option key={m.id} value={m.id}>
											{m.name}
										</option>
									))}
								</select>
							</div>
							<div className="space-y-2">
								<Label>Mode d&apos;exécution</Label>
								<div className="grid grid-cols-3 gap-3">
									{EXECUTION_MODES.map((m) => (
										<button
											key={m.id}
											type="button"
											onClick={() => updateField("mode", m.id.toUpperCase())}
											className={`rounded-md border p-3 text-left text-sm transition-colors ${
												formData.mode === m.id.toUpperCase()
													? "border-primary bg-primary/5"
													: "border-input hover:bg-accent"
											}`}
										>
											<div className="font-medium">{m.name}</div>
										</button>
									))}
								</div>
							</div>
							<div className="space-y-2">
								<Label htmlFor="systemPrompt">System Prompt</Label>
								<Textarea
									id="systemPrompt"
									value={formData.systemPrompt}
									onChange={(e) => updateField("systemPrompt", e.target.value)}
									placeholder="Instructions pour l'agent..."
									rows={6}
								/>
								<p className="text-xs text-muted-foreground">Max. 10 000 caractères</p>
							</div>
							{formData.mode !== "LOCAL" && (
								<div className="space-y-2">
									<Label>Stratégie d&apos;exécution cloud</Label>
									<div className="grid grid-cols-3 gap-3">
										{[
											{
												id: "USER_API_KEY",
												label: "Clé API utilisateur",
												desc: "L'utilisateur fournit sa propre clé",
											},
											{
												id: "SELLER_API_KEY",
												label: "Clé API vendeur",
												desc: "Vous fournissez votre clé API",
											},
											{
												id: "SELLER_ENDPOINT",
												label: "Endpoint custom",
												desc: "Votre propre serveur API",
											},
										].map((s) => (
											<button
												key={s.id}
												type="button"
												onClick={() => updateField("cloudStrategy", s.id)}
												className={`rounded-md border p-3 text-left text-sm transition-colors ${
													formData.cloudStrategy === s.id
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
							{formData.cloudStrategy === "USER_API_KEY" && formData.mode !== "LOCAL" && (
								<div className="space-y-2">
									<Label>Provider requis</Label>
									<select
										className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
										value={formData.requiredUserProvider}
										onChange={(e) => updateField("requiredUserProvider", e.target.value)}
									>
										<option value="anthropic">Anthropic (Claude)</option>
										<option value="openai">OpenAI (GPT)</option>
										<option value="google">Google (Gemini)</option>
										<option value="mistral">Mistral</option>
										<option value="groq">Groq</option>
									</select>
								</div>
							)}
							{formData.cloudStrategy === "SELLER_ENDPOINT" && formData.mode !== "LOCAL" && (
								<>
									<div className="space-y-2">
										<Label htmlFor="endpoint">URL de l&apos;endpoint</Label>
										<Input
											id="endpoint"
											value={formData.endpoint}
											onChange={(e) => updateField("endpoint", e.target.value)}
											placeholder="https://api.exemple.com/v1/chat"
										/>
									</div>
									<div className="space-y-2">
										<Label>Format de l&apos;API</Label>
										<select
											className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
											value={formData.endpointFormat}
											onChange={(e) => updateField("endpointFormat", e.target.value)}
										>
											<option value="OPENAI">OpenAI compatible</option>
											<option value="ANTHROPIC">Anthropic</option>
											<option value="GOOGLE">Google</option>
											<option value="MISTRAL">Mistral</option>
											<option value="GROQ">Groq</option>
											<option value="HUGGINGFACE">HuggingFace</option>
											<option value="CLAAKE">Claake</option>
										</select>
									</div>
								</>
							)}
							{formData.cloudStrategy === "SELLER_API_KEY" && formData.mode !== "LOCAL" && (
								<>
									<div className="space-y-2">
										<Label>Provider</Label>
										<select
											className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
											value={formData.sellerApiProvider}
											onChange={(e) => updateField("sellerApiProvider", e.target.value)}
										>
											<option value="anthropic">Anthropic (Claude)</option>
											<option value="openai">OpenAI (GPT)</option>
											<option value="google">Google (Gemini)</option>
											<option value="mistral">Mistral</option>
											<option value="groq">Groq</option>
										</select>
									</div>
									<div className="space-y-2">
										<Label htmlFor="sellerApiKey">Clé API vendeur</Label>
										<Input
											id="sellerApiKey"
											type="password"
											value={formData.sellerApiKey}
											onChange={(e) => updateField("sellerApiKey", e.target.value)}
											placeholder="sk-..."
										/>
										<p className="text-xs text-muted-foreground">
											Stockée chiffrée — jamais exposée aux utilisateurs.
										</p>
									</div>
								</>
							)}
							{(formData.mode === "LOCAL" || formData.mode === "HYBRID") && (
								<>
									<div className="space-y-2">
										<Label htmlFor="dockerImage">Image Docker</Label>
										<Input
											id="dockerImage"
											value={formData.dockerImage}
											onChange={(e) => updateField("dockerImage", e.target.value)}
											placeholder="ghcr.io/moncompte/mon-agent:latest"
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="downloadUrl">URL de téléchargement (optionnel)</Label>
										<Input
											id="downloadUrl"
											value={formData.downloadUrl}
											onChange={(e) => updateField("downloadUrl", e.target.value)}
											placeholder="https://releases.exemple.com/agent-v1.0.zip"
										/>
									</div>
								</>
							)}
						</div>
					)}

					{/* Step 3: Pricing */}
					{currentStep === 3 && (
						<div className="space-y-4">
							<h3 className="text-lg font-semibold">Tarification</h3>
							<p className="text-sm text-muted-foreground">
								Pour le MVP, seuls les agents gratuits sont disponibles.
							</p>
							<div className="rounded-md border bg-muted/50 p-4">
								<Badge>Gratuit</Badge>
								<p className="mt-2 text-sm text-muted-foreground">
									Votre agent sera disponible gratuitement pour tous les utilisateurs. Les options
									de monétisation seront disponibles prochainement.
								</p>
							</div>
						</div>
					)}

					{/* Step 4: Review */}
					{currentStep === 4 && (
						<div className="space-y-4">
							<h3 className="text-lg font-semibold">Validation et soumission</h3>
							<div className="space-y-3 rounded-md border p-4">
								{imagePreview && (
									<>
										<div className="flex items-center gap-3">
											<Image
												src={imagePreview}
												alt="Agent icon"
												width={48}
												height={48}
												className="rounded-lg border object-cover"
											/>
											<span className="text-sm font-medium">{formData.name || "Sans nom"}</span>
										</div>
										<Separator />
									</>
								)}
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">Nom</span>
									<span className="font-medium">{formData.name || "Non renseigné"}</span>
								</div>
								<Separator />
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">Catégorie</span>
									<span>{formData.category || "Non renseigné"}</span>
								</div>
								<Separator />
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">Modèle</span>
									<span className="font-mono text-xs">{formData.model}</span>
								</div>
								<Separator />
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">Mode</span>
									<span className="capitalize">{formData.mode}</span>
								</div>
								{formData.mode !== "LOCAL" && (
									<>
										<Separator />
										<div className="flex justify-between text-sm">
											<span className="text-muted-foreground">Stratégie cloud</span>
											<span>{formData.cloudStrategy}</span>
										</div>
									</>
								)}
								<Separator />
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">System Prompt</span>
									<span className="text-xs">
										{formData.systemPrompt
											? `${formData.systemPrompt.length} caractères`
											: "Non renseigné"}
									</span>
								</div>
								<Separator />
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">Fichier .agentjson</span>
									<span className="text-xs">
										{agentJsonFile ? agentJsonFile.name : "Non fourni"}
									</span>
								</div>
								<Separator />
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">Prix</span>
									<Badge>Gratuit</Badge>
								</div>
							</div>

							{submitError && (
								<div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
									<AlertCircle className="h-4 w-4 shrink-0" />
									{submitError}
								</div>
							)}

							<p className="text-xs text-muted-foreground">
								Votre agent sera soumis à une validation automatique (schéma, sécurité, permissions)
								puis publié si tout est conforme. En cas d&apos;alerte, une revue manuelle sera
								effectuée.
							</p>
						</div>
					)}

					{/* Navigation */}
					<div className="mt-8 flex justify-between">
						<Button
							variant="outline"
							disabled={currentStep === 0}
							onClick={() => setCurrentStep((s) => s - 1)}
						>
							<ArrowLeft className="mr-2 h-4 w-4" />
							Précédent
						</Button>
						{currentStep < steps.length - 1 ? (
							<Button onClick={() => setCurrentStep((s) => s + 1)} disabled={!canAdvance()}>
								Suivant
								<ArrowRight className="ml-2 h-4 w-4" />
							</Button>
						) : (
							<Button onClick={handleSubmit} disabled={submitting}>
								<Upload className="mr-2 h-4 w-4" />
								{submitting ? "Soumission..." : "Soumettre l'agent"}
							</Button>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
