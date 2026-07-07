"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AgentBuilderForm, SetField } from "../agent-builder.types";

interface QualityStepProps {
	form: AgentBuilderForm;
	setField: SetField;
	disabled?: boolean;
}

/** Champs qualité (M5) : format de sortie, checklist, variables, few-shot. */
export function QualityStep({ form, setField, disabled = false }: QualityStepProps) {
	return (
		<div className="space-y-4">
			<div className="grid gap-4 sm:grid-cols-2">
				<div className="space-y-2">
					<Label htmlFor="outputFormat">Format de sortie</Label>
					<Textarea
						id="outputFormat"
						value={form.outputFormat}
						onChange={(e) => setField("outputFormat", e.target.value)}
						placeholder={"Réponds en sections : Résumé / Analyse / Recommandations"}
						rows={4}
						disabled={disabled}
					/>
					<p className="text-xs text-muted-foreground">Consigne de format injectée au prompt.</p>
				</div>
				<div className="space-y-2">
					<Label htmlFor="qualityChecklist">Checklist qualité</Label>
					<Textarea
						id="qualityChecklist"
						value={form.qualityChecklist}
						onChange={(e) => setField("qualityChecklist", e.target.value)}
						placeholder={"Réponse claire\nIncertitudes explicites\nProchaine action concrète"}
						rows={4}
						disabled={disabled}
					/>
					<p className="text-xs text-muted-foreground">Une règle qualité par ligne.</p>
				</div>
			</div>
			<div className="grid gap-4 sm:grid-cols-2">
				<div className="space-y-2">
					<Label htmlFor="variables">Variables agent (JSON)</Label>
					<Textarea
						id="variables"
						value={form.variables}
						onChange={(e) => setField("variables", e.target.value)}
						placeholder={'{"pays":"France","niveau":"expert"}'}
						rows={5}
						disabled={disabled}
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="fewShotExamples">Exemples few-shot (JSON)</Label>
					<Textarea
						id="fewShotExamples"
						value={form.fewShotExamples}
						onChange={(e) => setField("fewShotExamples", e.target.value)}
						placeholder={'[{"user":"Question","assistant":"Réponse attendue"}]'}
						rows={5}
						disabled={disabled}
					/>
				</div>
			</div>
		</div>
	);
}
