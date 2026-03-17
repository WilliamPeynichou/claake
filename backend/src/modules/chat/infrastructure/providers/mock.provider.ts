import { Injectable } from "@nestjs/common";
import type { AIProviderPort, StreamTextParams } from "../../domain/ports/ai-provider.port.js";

const MOCK_RESPONSES = [
	"Bonjour ! Je suis l'agent de test Claake. Je reçois bien votre message et je vous réponds en streaming.",
	"Ceci est une réponse de test générée par le MockProvider. Le chat fonctionne correctement.",
	"Super, le flow de conversation est opérationnel ! Vous pouvez maintenant tester avec un vrai modèle.",
	"Je suis un agent fictif. Chaque message que vous m'envoyez reçoit une réponse scriptée différente.",
	"Test réussi ! Le streaming SSE, la session de chat et l'interface fonctionnent comme attendu.",
];

let responseIndex = 0;

@Injectable()
export class MockProvider implements AIProviderPort {
	async *streamText(_params: StreamTextParams): AsyncIterable<string> {
		const response = MOCK_RESPONSES[responseIndex % MOCK_RESPONSES.length];
		responseIndex++;

		const words = response.split(" ");

		for (const word of words) {
			yield `${word} `;
			await new Promise((resolve) => setTimeout(resolve, 40));
		}
	}
}
