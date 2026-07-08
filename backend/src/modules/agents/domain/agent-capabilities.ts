/** Agent file/image capabilities as exposed by the API contract. */
export interface AgentCapabilities {
	files: boolean;
	images: boolean;
}

/** Normalizes the loosely-typed Prisma `capabilities` JSON into a strict shape. */
export function normalizeAgentCapabilities(
	raw: Record<string, unknown> | null | undefined,
): AgentCapabilities {
	return {
		files: raw?.files === true,
		images: raw?.images === true,
	};
}
