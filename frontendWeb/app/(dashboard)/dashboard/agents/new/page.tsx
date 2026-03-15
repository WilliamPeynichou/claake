"use client";

import type { AgentCategory } from "@claake/shared";
import { AI_MODELS, EXECUTION_MODES } from "@claake/shared";
import { ArrowLeft, ArrowRight, Check, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api";

const steps = ["Fichier .agentjson", "Métadonnées", "Configuration", "Tarification", "Validation"];

export default function NewAgentPage() {
	const router = useRouter();
	const [categories, setCategories] = useState<AgentCategory[]>([]);
	const [currentStep, setCurrentStep] = useState(0);

	useEffect(() => {
		apiClient.categories
			.list()
			.then(setCategories)
			.catch(() => {});
	}, []);
	const [formData, setFormData] = useState({
		name: "",
		description: "",
		longDescription: "",
		category: "",
		tags: "",
		model: "claude-sonnet-4-20250514",
		mode: "cloud" as "local" | "cloud" | "hybrid",
		systemPrompt: "",
		endpoint: "",
		priceType: "free",
		price: "0",
	});
	const [submitted, setSubmitted] = useState(false);

	function updateField(field: string, value: string) {
		setFormData((prev) => ({ ...prev, [field]: value }));
	}

	function handleSubmit() {
		setSubmitted(true);
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
				<div className="mt-8 flex gap-4">
					<Button variant="outline" onClick={() => router.push("/dashboard/agents")}>
						Voir mes agents
					</Button>
					<Button
						onClick={() => {
							setSubmitted(false);
							setCurrentStep(0);
							setFormData({
								name: "",
								description: "",
								longDescription: "",
								category: "",
								tags: "",
								model: "claude-sonnet-4-20250514",
								mode: "cloud",
								systemPrompt: "",
								endpoint: "",
								priceType: "free",
								price: "0",
							});
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
							<div className="flex items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors hover:bg-muted/50">
								<div className="text-center">
									<Upload className="mx-auto h-8 w-8 text-muted-foreground" />
									<p className="mt-2 text-sm font-medium">Glissez votre fichier .agentjson ici</p>
									<p className="text-xs text-muted-foreground">ou cliquez pour sélectionner</p>
									<Button variant="outline" size="sm" className="mt-4">
										Sélectionner un fichier
									</Button>
								</div>
							</div>
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
							<div className="space-y-2">
								<Label htmlFor="name">Nom de l&apos;agent</Label>
								<Input
									id="name"
									value={formData.name}
									onChange={(e) => updateField("name", e.target.value)}
									placeholder="ex: CodeReview Pro"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="description">Description courte</Label>
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
								<Label>Catégorie</Label>
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
											onClick={() => updateField("mode", m.id)}
											className={`rounded-md border p-3 text-left text-sm transition-colors ${
												formData.mode === m.id
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
							{formData.mode !== "local" && (
								<div className="space-y-2">
									<Label htmlFor="endpoint">Endpoint (URL)</Label>
									<Input
										id="endpoint"
										value={formData.endpoint}
										onChange={(e) => updateField("endpoint", e.target.value)}
										placeholder="https://api.example.com/agent"
									/>
								</div>
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
								<Separator />
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">Prix</span>
									<Badge>Gratuit</Badge>
								</div>
							</div>
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
							<Button onClick={() => setCurrentStep((s) => s + 1)}>
								Suivant
								<ArrowRight className="ml-2 h-4 w-4" />
							</Button>
						) : (
							<Button onClick={handleSubmit}>
								<Upload className="mr-2 h-4 w-4" />
								Soumettre l&apos;agent
							</Button>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
