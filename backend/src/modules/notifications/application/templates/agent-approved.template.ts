import { baseLayout } from "./base-layout.js";

export function agentApprovedTemplate(agentName: string): string {
	return baseLayout(`
		<h1>Agent approuv&eacute; !</h1>
		<p>Bonne nouvelle ! Votre agent <strong>${agentName}</strong> a &eacute;t&eacute; approuv&eacute; et est d&eacute;sormais visible dans le catalogue Claake.</p>
		<p>Les utilisateurs peuvent maintenant le d&eacute;couvrir et l'utiliser.</p>
	`);
}
