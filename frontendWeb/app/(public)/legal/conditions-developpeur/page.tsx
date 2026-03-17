export default function ConditionsDeveloppeurPage() {
	return (
		<article className="prose prose-neutral dark:prose-invert max-w-none">
			<p className="text-sm text-muted-foreground">Dernière mise à jour : mars 2026</p>

			<h1>Conditions développeur</h1>

			<p>
				Les présentes Conditions développeur (ci-après « Conditions ») régissent la publication et
				la distribution d'agents IA sur la plateforme Claake (claake.com) par des développeurs tiers
				(ci-après « Développeur »). Elles complètent les Conditions Générales d'Utilisation (CGU) et
				s'y substituent en cas de conflit sur les sujets couverts par les présentes.
			</p>

			<h2>Article 1 — Éligibilité</h2>
			<p>Pour publier un agent sur Claake, le Développeur doit :</p>
			<ul>
				<li>
					Être une personne physique majeure (18 ans ou plus) ou une personne morale dûment
					constituée ;
				</li>
				<li>Disposer d'un compte Claake valide et vérifié ;</li>
				<li>Accepter les présentes Conditions développeur ;</li>
				<li>
					Fournir les informations nécessaires à l'identification (nom, email, informations fiscales
					si applicable).
				</li>
			</ul>
			<p>
				Claake se réserve le droit de refuser l'accès au statut de Développeur sans avoir à en
				justifier.
			</p>

			<h2>Article 2 — Obligations du Développeur</h2>
			<p>Le Développeur s'engage à :</p>

			<h3>2.1 Qualité et conformité</h3>
			<ul>
				<li>
					Publier des agents conformes au format .agentjson défini par Claake et à jour des
					dernières spécifications ;
				</li>
				<li>
					S'assurer que les agents publiés fonctionnent correctement et sont exempts de codes
					malveillants ;
				</li>
				<li>
					Mettre à jour ses agents en cas de bug critique ou de faille de sécurité dans un délai
					raisonnable (72h) ;
				</li>
				<li>Fournir une description exacte et complète des capacités et limitations de l'agent.</li>
			</ul>

			<h3>2.2 Légalité du contenu</h3>
			<ul>
				<li>
					Ne pas publier d'agents qui génèrent du contenu illégal, discriminatoire, diffamatoire,
					obscène ou portant atteinte à des tiers ;
				</li>
				<li>Respecter les droits de propriété intellectuelle de tiers ;</li>
				<li>
					Ne pas inclure de données personnelles d'utilisateurs sans leur consentement explicite
					dans les agents.
				</li>
			</ul>

			<h3>2.3 Transparence</h3>
			<ul>
				<li>
					Déclarer explicitement les permissions requises par l'agent (accès internet, etc.) ;
				</li>
				<li>
					Ne pas induire en erreur les utilisateurs sur les capacités ou la nature de l'agent.
				</li>
			</ul>

			<h2>Article 3 — Licence accordée à Claake</h2>
			<p>
				En publiant un agent sur la Plateforme, le Développeur accorde à Claake une licence
				mondiale, non exclusive, gratuite, pour :
			</p>
			<ul>
				<li>Héberger, stocker et distribuer l'agent via la Plateforme ;</li>
				<li>Reproduire l'agent à des fins de sauvegarde et de sécurité ;</li>
				<li>
					Afficher le nom, la description et les visuels associés à l'agent à des fins de promotion
					de la Plateforme ;
				</li>
				<li>Analyser l'agent à des fins de modération et de sécurité.</li>
			</ul>
			<p>
				Cette licence prend fin lors du retrait de l'agent de la Plateforme, sous réserve des copies
				de sauvegarde nécessaires.
			</p>

			<h2>Article 4 — Commissions et rémunération</h2>
			<p>
				Pour les agents payants, Claake perçoit une commission sur chaque transaction réalisée via
				la Plateforme. Le taux de commission est disponible dans le tableau de bord Développeur et
				peut être modifié avec un préavis de 30 jours.
			</p>
			<p>
				Les reversements sont effectués selon les modalités définies dans le tableau de bord
				Développeur (fréquence, seuil minimum, mode de paiement). Le Développeur est responsable de
				ses obligations fiscales relatives aux revenus perçus.
			</p>
			<p>
				Pour les agents gratuits, aucune commission n'est perçue. Claake peut proposer des modèles
				de monétisation complémentaires (dons, abonnements, etc.) à l'avenir.
			</p>

			<h2>Article 5 — Retrait d'un agent</h2>
			<p>
				Le Développeur peut retirer son agent de la Plateforme à tout moment depuis son tableau de
				bord. Le retrait prend effet immédiatement pour les nouvelles installations, mais n'affecte
				pas les Utilisateurs ayant déjà accès à l'agent.
			</p>
			<p>Claake peut retirer un agent sans préavis en cas de :</p>
			<ul>
				<li>Violation des présentes Conditions ;</li>
				<li>Signalement avéré par des Utilisateurs ;</li>
				<li>Faille de sécurité non corrigée dans les délais impartis ;</li>
				<li>Décision judiciaire ou administrative.</li>
			</ul>
			<p>
				En cas de retrait par Claake, le Développeur en est informé par email dans les meilleurs
				délais, avec les motifs du retrait.
			</p>

			<h2>Article 6 — Indemnisation</h2>
			<p>
				Le Développeur s'engage à indemniser et tenir indemne Claake, ses dirigeants, employés et
				partenaires de tout préjudice, réclamation, coût ou dépense (y compris les frais d'avocat)
				résultant de :
			</p>
			<ul>
				<li>La violation par le Développeur des présentes Conditions ;</li>
				<li>
					Un agent publié par le Développeur causant un dommage à un tiers ou portant atteinte à ses
					droits ;
				</li>
				<li>Toute fausse déclaration faite par le Développeur dans le cadre des présentes.</li>
			</ul>

			<h2>Contact et support développeur</h2>
			<p>
				Pour toute question relative aux présentes Conditions ou au programme développeur,
				contactez-nous à : <a href="mailto:claake@contact.com">claake@contact.com</a>
			</p>
		</article>
	);
}
