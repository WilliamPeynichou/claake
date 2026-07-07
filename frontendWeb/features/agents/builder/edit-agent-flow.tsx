"use client";

import type { Agent, AgentCategory } from "@claake/shared";
import { AlertCircle, ArrowLeft, Check, FileJson, ImagePlus, Loader2, Save, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { FileUploader } from "@/components/uploads";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/lib/hooks/use-auth";
import { uploadAgentConfigFile, uploadAgentImage } from "@/lib/supabase/storage";
import { useAgentBuilderForm } from "./agent-builder.reducer";
import type { SetField } from "./agent-builder.types";
import { agentToForm } from "./lib/agent-to-form";
import { buildUpdateAgentPayload } from "./lib/build-agent-payload";
import { BehaviorStep } from "./steps/behavior-step";
import { ExecutionStep } from "./steps/execution-step";
import { MetadataStep } from "./steps/metadata-step";
import { ModelStep } from "./steps/model-step";
import { QualityStep } from "./steps/quality-step";

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

/** Édition d'un agent existant (brouillon/rejeté modifiables). */
export function EditAgentFlow() {
	const { id } = useParams<{ id: string }>();
	const { token, user } = useAuth();
	const imageInputRef = useRef<HTMLInputElement>(null);
	const configInputRef = useRef<HTMLInputElement>(null);

	const { form, setField, hydrate } = useAgentBuilderForm();
	const [agent, setAgent] = useState<Agent | null>(null);
	const [categories, setCategories] = useState<AgentCategory[]>([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const [configFile, setConfigFile] = useState<File | null>(null);

	useEffect(() => {
		Promise.all([apiClient.agents.get(id), apiClient.categories.list()])
			.then(([agentData, cats]) => {
				setAgent(agentData);
				setCategories(cats);
				hydrate(agentToForm(agentData));
				if (agentData.image_url) setImagePreview(agentData.image_url);
			})
			.catch(() => setError("Impossible de charger l'agent."))
			.finally(() => setLoading(false));
	}, [id, hydrate]);

	const updateField: SetField = (field, value) => {
		setField(field, value);
		setSuccess(false);
	};

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

	function handleConfigFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;
		setConfigFile(file);
		setError(null);
	}

	async function handleSave() {
		if (!token || !agent || !user) return;

		setSaving(true);
		setError(null);
		setSuccess(false);

		try {
			let imageUrl: string | undefined;
			if (imageFile) imageUrl = await uploadAgentImage(imageFile, agent.slug, user.id);

			let configUrl: string | undefined;
			if (configFile) configUrl = await uploadAgentConfigFile(configFile, agent.slug, user.id);

			const payload = buildUpdateAgentPayload(form, { imageUrl, configUrl });
			await apiClient.agents.update(agent.id, payload, token);

			setSuccess(true);
		} catch (err) {
			setError(
				err instanceof SyntaxError
					? "Variables ou exemples few-shot invalides : JSON attendu."
					: err instanceof Error
						? err.message
						: "Erreur lors de la sauvegarde.",
			);
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

					{isEditable && (
						<div className="space-y-2">
							<Label>Fichier .agentjson</Label>
							<div className="flex items-center gap-3">
								<button
									type="button"
									onClick={() => configInputRef.current?.click()}
									className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-dashed transition-colors hover:bg-muted/50"
								>
									<FileJson className="h-5 w-5 text-muted-foreground" />
								</button>
								<div className="text-sm text-muted-foreground">
									{configFile ? (
										<span className="text-green-600">{configFile.name}</span>
									) : agent.config_url ? (
										<span>Config existante — sélectionnez un fichier pour la remplacer</span>
									) : (
										<span>Aucune config — vous pouvez en ajouter une</span>
									)}
									<Button
										variant="outline"
										size="sm"
										className="ml-2"
										onClick={() => configInputRef.current?.click()}
									>
										Choisir un .agentjson
									</Button>
								</div>
								<input
									ref={configInputRef}
									type="file"
									accept=".agentjson,.json"
									onChange={handleConfigFileSelect}
									className="hidden"
								/>
							</div>
						</div>
					)}

					<Separator />

					<MetadataStep
						form={form}
						setField={updateField}
						categories={categories}
						disabled={!isEditable}
					/>

					<Separator />

					<div className="space-y-4">
						<h3 className="text-lg font-semibold">Configuration</h3>
						<ModelStep form={form} setField={updateField} disabled={!isEditable} />
						<BehaviorStep form={form} setField={updateField} disabled={!isEditable} />
						<QualityStep form={form} setField={updateField} disabled={!isEditable} />
						<ExecutionStep form={form} setField={updateField} disabled={!isEditable} />
					</div>

					<Separator />
					<div className="space-y-4">
						<h3 className="text-lg font-semibold">Médias &amp; Documents</h3>
						{token && <FileUploader token={token} agentId={id} />}
					</div>

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
