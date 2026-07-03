"use client";

interface AccessNoticeProps {
	reason: "purchase_required" | "not_published";
}

const MESSAGES: Record<AccessNoticeProps["reason"], string> = {
	purchase_required: "Un achat est requis pour utiliser cet agent.",
	not_published: "Cet agent n'est pas publié.",
};

/** Bandeau d'information pour les raisons d'accès non actionnables directement dans le chat. */
export function AccessNotice({ reason }: AccessNoticeProps) {
	return (
		<div className="mx-4 mt-4 border px-4 py-3 text-sm text-amber-700">{MESSAGES[reason]}</div>
	);
}
