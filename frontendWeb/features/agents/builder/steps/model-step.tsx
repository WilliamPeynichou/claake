"use client";

import { AI_MODELS, EXECUTION_MODES } from "@claake/shared";
import { Label } from "@/components/ui/label";
import type { AgentBuilderForm, ExecutionModeValue, SetField } from "../agent-builder.types";

interface ModelStepProps {
	form: AgentBuilderForm;
	setField: SetField;
	disabled?: boolean;
}

/** Choix du modèle IA et du mode d'exécution. */
export function ModelStep({ form, setField, disabled = false }: ModelStepProps) {
	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<Label>Modèle IA</Label>
				<select
					className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
					value={form.model}
					onChange={(e) => setField("model", e.target.value)}
					disabled={disabled}
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
					{EXECUTION_MODES.map((m) => {
						const value = m.id.toUpperCase() as ExecutionModeValue;
						return (
							<button
								key={m.id}
								type="button"
								onClick={() => !disabled && setField("mode", value)}
								disabled={disabled}
								className={`rounded-md border p-3 text-left text-sm transition-colors disabled:opacity-50 ${
									form.mode === value
										? "border-primary bg-primary/5"
										: "border-input hover:bg-accent"
								}`}
							>
								<div className="font-medium">{m.name}</div>
							</button>
						);
					})}
				</div>
			</div>
		</div>
	);
}
