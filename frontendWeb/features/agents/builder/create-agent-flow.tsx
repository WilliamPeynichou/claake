"use client";

import type { AgentCategory, ValidationResult } from "@claake/shared";
import { AlertCircle, ArrowLeft, ArrowRight, Check, ImagePlus, Upload, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/lib/hooks/use-auth";
import { uploadAgentConfigFile, uploadAgentImage } from "@/lib/supabase/storage";
import { useAgentBuilderForm } from "./agent-builder.reducer";
import { buildCreateAgentPayload, slugify } from "./lib/build-agent-payload";
import { parseAgentJson } from "./lib/parse-agent-json";
import {
	CREATE_STEPS,
	canAdvanceCreateStep,
	hasRequiredFields,
} from "./lib/validate-agent-builder";
import { BehaviorStep } from "./steps/behavior-step";
import { ExecutionStep } from "./steps/execution-step";
import { MetadataStep } from "./steps/metadata-step";
import { ModelStep } from "./steps/model-step";
import { QualityStep } from "./steps/quality-step";

/** Wizard de création d'agent (mode brouillon). */
export function CreateAgentFlow() {
	const router = useRouter();
	const { token, user } = useAuth();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const imageInputRef = useRef<HTMLInputElement>(null);

	const { form, setField, hydrate, reset } = useAgentBuilderForm();
	const [categories, setCategories] = useState<AgentCategory[]>([]);
	const [currentStep, setCurrentStep] = useState(0);
	const [submitting, setSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [submitWarnings, setSubmitWarnings] = useState<string[]>([]);
	const [validation, setValidation] = useState<ValidationResult | null>(null);
	const [createdAgentId, setCreatedAgentId] = useState<string | null>(null);
	const [backendError, setBackendError] = useState<string | null>(null);
	const [submitted, setSubmitted] = useState(false);

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

	async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;
		try {
			const patch = parseAgentJson(await file.text());
			setAgentJsonFile(file);
			hydrate(patch);
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

	async function handleSubmit() {
		if (!token || !user) {
			setSubmitError("Vous devez être connecté.");
			return;
		}
		if (!hasRequiredFields(form)) {
			setSubmitError("Veuillez remplir les champs obligatoires (nom, description, catégorie).");
			return;
		}

		setSubmitting(true);
		setSubmitError(null);
		setSubmitWarnings([]);

		try {
			const slug = slugify(form.name);
			const warnings: string[] = [];

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

			const payload = buildCreateAgentPayload(form, { imageUrl, configUrl });
			const result = await apiClient.agents.create(payload, token);

			setCreatedAgentId(result.id);
			setValidation(null);
			setSubmitWarnings(warnings);
			setSubmitted(true);
		} catch (err) {
			setSubmitError(
				err instanceof SyntaxError
					? "Variables ou exemples few-shot invalides : JSON attendu."
					: err instanceof Error
						? err.message
						: "Erreur lors de la soumission.",
			);
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
				<h2 className="mt-6 text-2xl font-bold">Brouillon créé avec succès</h2>
				<p className="mt-2 max-w-md text-muted-foreground">
					Votre agent <strong>{form.name}</strong> est enregistré en brouillon. Vous pouvez
					maintenant le tester dans le chat, le modifier, puis le soumettre à validation.
				</p>

				{submitWarnings.length > 0 && (
					<div className="mt-4 w-full max-w-md rounded-md border border-orange-500/50 bg-orange-50 p-3 text-left dark:bg-orange-900/20">
						<p className="mb-1 text-sm font-medium text-orange-700 dark:text-orange-400">
							Avertissements d&apos;upload
						</p>
						{submitWarnings.map((w) => (
							<p
								key={w}
								className="flex items-start gap-1 text-sm text-orange-600 dark:text-orange-300"
							>
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
					{createdAgentId && (
						<Button variant="outline" onClick={() => router.push(`/chat/${createdAgentId}?test=1`)}>
							Tester dans le chat
						</Button>
					)}
					{createdAgentId && (
						<Button onClick={() => router.push(`/dashboard/agents/${createdAgentId}/edit`)}>
							Modifier le brouillon
						</Button>
					)}
					<Button
						onClick={() => {
							setSubmitted(false);
							setValidation(null);
							setCreatedAgentId(null);
							setSubmitWarnings([]);
							setCurrentStep(0);
							reset();
							setAgentJsonFile(null);
							removeImage();
						}}
					>
						Créer un autre agent
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

			<div className="mt-8 flex items-center gap-2">
				{CREATE_STEPS.map((step, i) => (
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
						{i < CREATE_STEPS.length - 1 && <Separator className="w-4 sm:w-8" />}
					</div>
				))}
			</div>

			<Card className="mt-8">
				<CardContent className="p-6">
					{currentStep === 0 && (
						<div className="space-y-4">
							<div>
								<h3 className="text-lg font-semibold">Fichier .agentjson</h3>
								<p className="text-sm text-muted-foreground">
									Uploadez votre fichier de définition d&apos;agent ou créez-en un manuellement.
								</p>
							</div>
							<input
								ref={fileInputRef}
								type="file"
								accept=".agentjson,.json"
								onChange={handleFileUpload}
								className="hidden"
							/>
							<button
								type="button"
								className={`flex w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors ${
									dropDragOver ? "border-primary bg-primary/5" : "hover:bg-muted/50"
								}`}
								onClick={() => fileInputRef.current?.click()}
								onDragOver={(e) => {
									e.preventDefault();
									setDropDragOver(true);
								}}
								onDragLeave={() => setDropDragOver(false)}
								onDrop={(e) => {
									e.preventDefault();
									setDropDragOver(false);
									const file = e.dataTransfer.files?.[0];
									if (file && fileInputRef.current) {
										const dt = new DataTransfer();
										dt.items.add(file);
										fileInputRef.current.files = dt.files;
										fileInputRef.current.dispatchEvent(new Event("change", { bubbles: true }));
									}
								}}
							>
								<div className="text-center">
									<Upload className="mx-auto h-8 w-8 text-muted-foreground" />
									<p className="mt-2 text-sm font-medium">Glissez votre fichier .agentjson ici</p>
									<p className="text-xs text-muted-foreground">ou cliquez pour parcourir</p>
								</div>
							</button>
							<div className="flex justify-center">
								<Button variant="outline" onClick={() => setCurrentStep(1)}>
									Créer manuellement
								</Button>
							</div>
						</div>
					)}

					{currentStep === 1 && (
						<div className="space-y-4">
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

							<MetadataStep form={form} setField={setField} categories={categories} required />
						</div>
					)}

					{currentStep === 2 && (
						<div className="space-y-4">
							<h3 className="text-lg font-semibold">Configuration</h3>
							<ModelStep form={form} setField={setField} />
							<BehaviorStep form={form} setField={setField} />
							<QualityStep form={form} setField={setField} />
							<ExecutionStep form={form} setField={setField} showSellerApiKey />
						</div>
					)}

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
											<span className="text-sm font-medium">{form.name || "Sans nom"}</span>
										</div>
										<Separator />
									</>
								)}
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">Nom</span>
									<span className="font-medium">{form.name || "Non renseigné"}</span>
								</div>
								<Separator />
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">Catégorie</span>
									<span>{form.category || "Non renseigné"}</span>
								</div>
								<Separator />
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">Modèle</span>
									<span className="font-mono text-xs">{form.model}</span>
								</div>
								<Separator />
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">Mode</span>
									<span className="capitalize">{form.mode}</span>
								</div>
								{form.mode !== "LOCAL" && (
									<>
										<Separator />
										<div className="flex justify-between text-sm">
											<span className="text-muted-foreground">Stratégie cloud</span>
											<span>{form.cloudStrategy}</span>
										</div>
									</>
								)}
								<Separator />
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">System Prompt</span>
									<span className="text-xs">
										{form.systemPrompt ? `${form.systemPrompt.length} caractères` : "Non renseigné"}
									</span>
								</div>
								<Separator />
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">Message d'accueil</span>
									<span className="text-xs">
										{form.welcomeMessage ? "Renseigné" : "Non renseigné"}
									</span>
								</div>
								<Separator />
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">Prompts suggérés</span>
									<span className="text-xs">
										{form.suggestedPrompts.split("\n").filter((p) => p.trim()).length}
									</span>
								</div>
								<Separator />
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">Qualité agent</span>
									<span className="text-xs">
										{[
											form.variables.trim() && "variables",
											form.fewShotExamples.trim() && "few-shot",
											form.outputFormat.trim() && "format",
											form.qualityChecklist.trim() && "checklist",
										]
											.filter(Boolean)
											.join(", ") || "Non renseigné"}
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
								Votre agent sera enregistré en brouillon. Vous pourrez le tester dans le chat avant
								de le soumettre à validation.
							</p>
						</div>
					)}

					<div className="mt-8 flex justify-between">
						<Button
							variant="outline"
							disabled={currentStep === 0}
							onClick={() => setCurrentStep((s) => s - 1)}
						>
							<ArrowLeft className="mr-2 h-4 w-4" />
							Précédent
						</Button>
						{currentStep < CREATE_STEPS.length - 1 ? (
							<Button
								onClick={() => setCurrentStep((s) => s + 1)}
								disabled={!canAdvanceCreateStep(currentStep, form)}
							>
								Suivant
								<ArrowRight className="ml-2 h-4 w-4" />
							</Button>
						) : (
							<Button onClick={handleSubmit} disabled={submitting}>
								<Upload className="mr-2 h-4 w-4" />
								{submitting ? "Création..." : "Créer le brouillon"}
							</Button>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
