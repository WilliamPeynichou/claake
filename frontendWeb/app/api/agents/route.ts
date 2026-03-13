import { MOCK_AGENTS } from "@agentplace/shared";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const query = searchParams.get("q") ?? "";
	const category = searchParams.get("category") ?? "";

	let agents = MOCK_AGENTS.filter((a) => a.status === "published");

	if (query) {
		const q = query.toLowerCase();
		agents = agents.filter(
			(a) =>
				a.name.toLowerCase().includes(q) ||
				a.description.toLowerCase().includes(q) ||
				a.tags.some((t) => t.toLowerCase().includes(q)),
		);
	}

	if (category && category !== "all") {
		agents = agents.filter((a) => a.category === category);
	}

	return NextResponse.json({ agents, total: agents.length });
}
