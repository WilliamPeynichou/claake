import { baseLayout } from "./base-layout.js";

export function reviewReceivedTemplate(
	agentName: string,
	rating: number,
	reviewerName: string,
): string {
	const stars = "\u2605".repeat(rating) + "\u2606".repeat(5 - rating);
	return baseLayout(`
		<h1>Nouvel avis re&ccedil;u</h1>
		<p><strong>${reviewerName}</strong> a laiss&eacute; un avis sur votre agent <strong>${agentName}</strong>.</p>
		<p style="font-size: 20px; color: #f59e0b;">${stars}</p>
		<p>Connectez-vous pour voir le d&eacute;tail de l'avis.</p>
	`);
}
