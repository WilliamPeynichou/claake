"use client";

import type { Agent } from "@claake/shared";
import { MessageSquare } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ChatInterfaceProps {
	agent: Agent;
}

export function ChatInterface({ agent }: ChatInterfaceProps) {
	return (
		<Card>
			<CardContent className="flex flex-col items-center justify-center p-8 text-center">
				<MessageSquare className="h-12 w-12 text-muted-foreground/30" />
				<p className="mt-4 text-sm text-muted-foreground">
					Discutez avec <strong>{agent.name}</strong> dans l&apos;espace chat dédié.
				</p>
				<Button asChild className="mt-4">
					<Link href={`/chat?agent=${agent.id}`}>
						<MessageSquare className="mr-2 h-4 w-4" />
						Ouvrir le chat
					</Link>
				</Button>
			</CardContent>
		</Card>
	);
}
