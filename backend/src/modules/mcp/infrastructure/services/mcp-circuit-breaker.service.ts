import { Injectable } from "@nestjs/common";

export const MCP_CIRCUIT_BREAKER_FAILURE_THRESHOLD = 3;
export const MCP_CIRCUIT_BREAKER_COOLDOWN_MS = 60_000;

interface CircuitState {
	failures: number;
	openedAt?: number;
}

/**
 * Process-local circuit breaker for chat tool calls to an MCP server.
 * It deliberately holds no credentials or request data.
 */
@Injectable()
export class McpCircuitBreakerService {
	private readonly circuits = new Map<string, CircuitState>();

	assertAvailable(serverId: string): void {
		const state = this.circuits.get(serverId);
		if (!state?.openedAt) return;
		if (Date.now() - state.openedAt >= MCP_CIRCUIT_BREAKER_COOLDOWN_MS) {
			this.circuits.delete(serverId);
			return;
		}
		throw new Error("MCP server is temporarily unavailable");
	}

	recordSuccess(serverId: string): void {
		this.circuits.delete(serverId);
	}

	recordFailure(serverId: string): void {
		const state = this.circuits.get(serverId) ?? { failures: 0 };
		state.failures++;
		if (state.failures >= MCP_CIRCUIT_BREAKER_FAILURE_THRESHOLD) state.openedAt = Date.now();
		this.circuits.set(serverId, state);
	}
}
