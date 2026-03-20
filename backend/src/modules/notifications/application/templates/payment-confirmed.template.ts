import { baseLayout } from "./base-layout.js";

export function paymentConfirmedTemplate(
	agentName: string,
	amount: number,
	currency: string,
): string {
	const formattedAmount = `${amount.toFixed(2)} ${currency.toUpperCase()}`;
	return baseLayout(`
		<h1>Achat confirm&eacute;</h1>
		<p>Votre achat de l'agent <strong>${agentName}</strong> a &eacute;t&eacute; confirm&eacute;.</p>
		<p>Montant : <strong>${formattedAmount}</strong></p>
		<p>Vous pouvez d&eacute;sormais utiliser cet agent depuis votre biblioth&egrave;que.</p>
	`);
}
