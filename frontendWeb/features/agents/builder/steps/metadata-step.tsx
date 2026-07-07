"use client";

import type { AgentCategory } from "@claake/shared";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AgentBuilderForm, SetField } from "../agent-builder.types";

interface MetadataStepProps {
	form: AgentBuilderForm;
	setField: SetField;
	categories: AgentCategory[];
	disabled?: boolean;
	required?: boolean;
}

/** Champs d'identité de l'agent : nom, descriptions, catégorie, tags. */
export function MetadataStep({
	form,
	setField,
	categories,
	disabled = false,
	required = false,
}: MetadataStepProps) {
	const star = required ? <span className="text-destructive"> *</span> : null;

	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="name">Nom de l&apos;agent{star}</Label>
				<Input
					id="name"
					value={form.name}
					onChange={(e) => setField("name", e.target.value)}
					placeholder="ex: CodeReview Pro"
					disabled={disabled}
				/>
			</div>
			<div className="space-y-2">
				<Label htmlFor="description">Description courte{star}</Label>
				<Input
					id="description"
					value={form.description}
					onChange={(e) => setField("description", e.target.value)}
					placeholder="Une phrase décrivant votre agent"
					disabled={disabled}
				/>
			</div>
			<div className="space-y-2">
				<Label htmlFor="longDescription">Description détaillée</Label>
				<Textarea
					id="longDescription"
					value={form.longDescription}
					onChange={(e) => setField("longDescription", e.target.value)}
					placeholder="Description complète de votre agent..."
					rows={5}
					disabled={disabled}
				/>
			</div>
			<div className="space-y-2">
				<Label>Catégorie{star}</Label>
				<select
					className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
					value={form.category}
					onChange={(e) => setField("category", e.target.value)}
					disabled={disabled}
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
					value={form.tags}
					onChange={(e) => setField("tags", e.target.value)}
					placeholder="code, review, qualité"
					disabled={disabled}
				/>
			</div>
		</div>
	);
}
