"use client";

import type { BuilderMode } from "./agent-builder.types";
import { CreateAgentFlow } from "./create-agent-flow";
import { EditAgentFlow } from "./edit-agent-flow";

interface AgentBuilderPageProps {
	mode: BuilderMode;
}

/**
 * Point d'entrée unique du builder d'agent. Les routes `new` et `[id]/edit`
 * importent ce composant et ne diffèrent que par le `mode`.
 */
export function AgentBuilderPage({ mode }: AgentBuilderPageProps) {
	return mode === "create" ? <CreateAgentFlow /> : <EditAgentFlow />;
}
