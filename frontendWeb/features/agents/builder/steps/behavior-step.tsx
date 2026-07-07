"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AgentBuilderForm, SetField } from "../agent-builder.types";

interface BehaviorStepProps {
	form: AgentBuilderForm;
	setField: SetField;
	disabled?: boolean;
}

/** Comportement de l'agent : system prompt, accueil, prompts suggérés, limites. */
export function BehaviorStep({ form, setField, disabled = false }: BehaviorStepProps) {
	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="systemPrompt">System Prompt</Label>
				<Textarea
					id="systemPrompt"
					value={form.systemPrompt}
					onChange={(e) => setField("systemPrompt", e.target.value)}
					placeholder="Instructions pour l'agent..."
					rows={6}
					disabled={disabled}
				/>
				<p className="text-xs text-muted-foreground">Max. 10 000 caractères</p>
			</div>
			<div className="space-y-2">
				<Label htmlFor="welcomeMessage">Message d&apos;accueil</Label>
				<Textarea
					id="welcomeMessage"
					value={form.welcomeMessage}
					onChange={(e) => setField("welcomeMessage", e.target.value)}
					placeholder="Bonjour, je suis votre agent..."
					rows={3}
					disabled={disabled}
				/>
				<p className="text-xs text-muted-foreground">
					Affiché dans le chat avant le premier message.
				</p>
			</div>
			<div className="grid gap-4 sm:grid-cols-2">
				<div className="space-y-2">
					<Label htmlFor="suggestedPrompts">Prompts suggérés</Label>
					<Textarea
						id="suggestedPrompts"
						value={form.suggestedPrompts}
						onChange={(e) => setField("suggestedPrompts", e.target.value)}
						placeholder={"Analyse ce document\nRésume les points clés\nListe les risques"}
						rows={4}
						disabled={disabled}
					/>
					<p className="text-xs text-muted-foreground">Un prompt par ligne, maximum 6.</p>
				</div>
				<div className="space-y-2">
					<Label htmlFor="limitations">Limites / avertissements</Label>
					<Textarea
						id="limitations"
						value={form.limitations}
						onChange={(e) => setField("limitations", e.target.value)}
						placeholder={
							"Ne remplace pas un professionnel qualifié\nDomaine : droit français uniquement"
						}
						rows={3}
						disabled={disabled}
					/>
					<p className="text-xs text-muted-foreground">Une limite par ligne.</p>
				</div>
			</div>
		</div>
	);
}
