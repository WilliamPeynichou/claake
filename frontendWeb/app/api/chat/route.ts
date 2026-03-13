import { NextResponse } from "next/server";

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { message, api_key, history, system_prompt, model } = body;

		if (!message) {
			return NextResponse.json({ error: "Message requis." }, { status: 400 });
		}

		// If no API key provided, return a sandbox response
		if (!api_key) {
			const sandboxResponse = generateSandboxResponse(message);
			return NextResponse.json({ content: sandboxResponse });
		}

		// Determine provider from model name
		if (model?.includes("claude")) {
			return await callAnthropic(api_key, message, history, system_prompt, model);
		}
		if (model?.includes("gpt") || model?.includes("o1")) {
			return await callOpenAI(api_key, message, history, system_prompt, model);
		}

		// Fallback: generic sandbox response
		return NextResponse.json({
			content: `[Mode sandbox] Réponse simulée pour le modèle ${model}. Ajoutez votre clé API pour obtenir de vraies réponses.`,
		});
	} catch {
		return NextResponse.json({ error: "Erreur interne du serveur." }, { status: 500 });
	}
}

function generateSandboxResponse(message: string): string {
	const responses = [
		`Merci pour votre message ! En mode sandbox, je simule une réponse. Votre question était : "${message.slice(0, 100)}". Pour des réponses réelles, ajoutez votre clé API.`,
		`[Mode sandbox] J'ai bien reçu votre demande. Ceci est une réponse de démonstration. Configurez votre clé API pour interagir avec le vrai modèle IA.`,
		`Bonjour ! Ceci est une réponse sandbox. L'agent a bien reçu : "${message.slice(0, 80)}...". Pour des réponses complètes, ajoutez votre clé API dans les paramètres.`,
	];
	return responses[Math.floor(Math.random() * responses.length)];
}

async function callAnthropic(
	apiKey: string,
	message: string,
	history: Array<{ role: string; content: string }>,
	systemPrompt: string,
	model: string,
) {
	try {
		const messages = [
			...(history ?? []).map((m: { role: string; content: string }) => ({
				role: m.role,
				content: m.content,
			})),
			{ role: "user", content: message },
		];

		const res = await fetch("https://api.anthropic.com/v1/messages", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": apiKey,
				"anthropic-version": "2023-06-01",
			},
			body: JSON.stringify({
				model,
				max_tokens: 1024,
				system: systemPrompt || undefined,
				messages,
			}),
		});

		if (!res.ok) {
			const err = await res.json();
			return NextResponse.json(
				{ error: err.error?.message ?? "Erreur API Anthropic." },
				{ status: res.status },
			);
		}

		const data = await res.json();
		const content = data.content?.[0]?.text ?? "Réponse reçue mais contenu vide.";
		return NextResponse.json({ content });
	} catch {
		return NextResponse.json(
			{ error: "Impossible de contacter l'API Anthropic." },
			{ status: 502 },
		);
	}
}

async function callOpenAI(
	apiKey: string,
	message: string,
	history: Array<{ role: string; content: string }>,
	systemPrompt: string,
	model: string,
) {
	try {
		const messages = [
			...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
			...(history ?? []),
			{ role: "user", content: message },
		];

		const res = await fetch("https://api.openai.com/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				model,
				messages,
				max_tokens: 1024,
			}),
		});

		if (!res.ok) {
			const err = await res.json();
			return NextResponse.json(
				{ error: err.error?.message ?? "Erreur API OpenAI." },
				{ status: res.status },
			);
		}

		const data = await res.json();
		const content = data.choices?.[0]?.message?.content ?? "Réponse reçue mais contenu vide.";
		return NextResponse.json({ content });
	} catch {
		return NextResponse.json({ error: "Impossible de contacter l'API OpenAI." }, { status: 502 });
	}
}
