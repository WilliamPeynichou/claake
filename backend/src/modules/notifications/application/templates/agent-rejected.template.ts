import { baseLayout } from "./base-layout.js";

export function agentRejectedTemplate(agentName: string, reason?: string): string {
	return baseLayout(`
		<h1>Agent non approuv&eacute;</h1>
		<p>Votre agent <strong>${agentName}</strong> n'a pas &eacute;t&eacute; approuv&eacute; par notre &eacute;quipe de mod&eacute;ration.</p>
		${reason ? `<p><strong>Raison :</strong> ${reason}</p>` : ""}
		<p>Vous pouvez modifier votre agent et le soumettre &agrave; nouveau.</p>
	`);
}
