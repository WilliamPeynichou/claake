export default function ConfidentialitePage() {
	return (
		<article className="prose prose-neutral dark:prose-invert max-w-none">
			<p className="text-sm text-muted-foreground">Dernière mise à jour : mars 2026</p>

			<h1>Politique de confidentialité</h1>

			<p>
				Claake (ci-après « Claake ») attache une grande importance à la protection de vos données
				personnelles et au respect de votre vie privée. La présente Politique de confidentialité
				vous informe sur la manière dont nous collectons, utilisons et protégeons vos données
				personnelles conformément au Règlement Général sur la Protection des Données (RGPD) et à la
				loi Informatique et Libertés.
			</p>

			<h2>1. Responsable du traitement</h2>
			<p>
				Le responsable du traitement est :{" "}
				<strong>
					Claake, [FORME_JURIDIQUE], [ADRESSE_SIÈGE], immatriculée sous le numéro SIRET [SIRET].
				</strong>
			</p>
			<p>
				Délégué à la Protection des Données (DPO) :{" "}
				<a href="mailto:williampeynichou@claake.com">williampeynichou@claake.com</a>
			</p>

			<h2>2. Données collectées</h2>
			<p>Nous collectons les catégories de données suivantes :</p>

			<h3>2.1 Données fournies par l'Utilisateur</h3>
			<ul>
				<li>
					<strong>Données d'identification :</strong> nom, prénom, adresse email, pseudo ;
				</li>
				<li>
					<strong>Données de connexion :</strong> logs d'authentification, adresse IP, navigateur ;
				</li>
				<li>
					<strong>Données de paiement :</strong> informations de facturation (traitées par notre
					prestataire de paiement — nous ne stockons pas les données de carte bancaire) ;
				</li>
				<li>
					<strong>Contenu généré :</strong> agents publiés, descriptions, interactions.
				</li>
			</ul>

			<h3>2.2 Données collectées automatiquement</h3>
			<ul>
				<li>Données de navigation et d'utilisation de la Plateforme ;</li>
				<li>Cookies et traceurs (voir Politique cookies) ;</li>
				<li>Données techniques (type d'appareil, système d'exploitation, résolution d'écran).</li>
			</ul>

			<h2>3. Finalités du traitement</h2>
			<p>Vos données sont traitées pour les finalités suivantes :</p>
			<ul>
				<li>
					<strong>Gestion du compte :</strong> création, authentification, gestion des accès ;
				</li>
				<li>
					<strong>Fourniture des services :</strong> accès au catalogue, exécution des agents,
					publication ;
				</li>
				<li>
					<strong>Facturation et paiements :</strong> traitement des transactions, émission des
					factures ;
				</li>
				<li>
					<strong>Communication :</strong> envoi d'emails transactionnels, notifications, support ;
				</li>
				<li>
					<strong>Amélioration des services :</strong> analyse d'usage, statistiques anonymisées ;
				</li>
				<li>
					<strong>Conformité légale :</strong> obligations comptables, fiscales et légales.
				</li>
			</ul>

			<h2>4. Bases légales du traitement</h2>
			<ul>
				<li>
					<strong>Exécution du contrat :</strong> traitement nécessaire à la fourniture des services
					(article 6.1.b RGPD) ;
				</li>
				<li>
					<strong>Consentement :</strong> communications marketing, cookies non essentiels (article
					6.1.a RGPD) ;
				</li>
				<li>
					<strong>Obligation légale :</strong> conservation des données comptables et fiscales
					(article 6.1.c RGPD) ;
				</li>
				<li>
					<strong>Intérêt légitime :</strong> sécurité de la Plateforme, prévention de la fraude,
					amélioration des services (article 6.1.f RGPD).
				</li>
			</ul>

			<h2>5. Durées de conservation</h2>
			<ul>
				<li>
					<strong>Données de compte actif :</strong> durée de la relation contractuelle + 3 ans
					après la dernière activité ;
				</li>
				<li>
					<strong>Données de facturation :</strong> 10 ans (obligation légale) ;
				</li>
				<li>
					<strong>Logs de connexion :</strong> 12 mois ;
				</li>
				<li>
					<strong>Cookies analytiques :</strong> 13 mois maximum.
				</li>
			</ul>

			<h2>6. Destinataires des données</h2>
			<p>Vos données peuvent être transmises à :</p>
			<ul>
				<li>
					<strong>Supabase :</strong> hébergement de la base de données (Singapour / Union
					européenne) ;
				</li>
				<li>
					<strong>Vercel :</strong> hébergement du site web (États-Unis — Privacy Shield / SCC) ;
				</li>
				<li>
					<strong>Prestataire de paiement :</strong> [PRESTATAIRE_PAIEMENT] ;
				</li>
				<li>
					<strong>Service d'emails transactionnels :</strong> [PRESTATAIRE_EMAIL] ;
				</li>
				<li>
					<strong>Autorités légales :</strong> en cas d'obligation légale ou réglementaire.
				</li>
			</ul>
			<p>Claake ne vend pas vos données personnelles à des tiers.</p>

			<h2>7. Transferts hors UE</h2>
			<p>
				Certains de nos sous-traitants sont établis en dehors de l'Union européenne. Dans ce cas,
				Claake s'assure que des garanties appropriées sont en place (clauses contractuelles types de
				la Commission européenne, décision d'adéquation ou autre mécanisme conforme au RGPD).
			</p>

			<h2>8. Sécurité</h2>
			<p>
				Claake met en œuvre des mesures techniques et organisationnelles appropriées pour protéger
				vos données contre tout accès non autorisé, perte, destruction ou divulgation accidentelle.
				Ces mesures incluent notamment : chiffrement des données en transit (HTTPS/TLS), chiffrement
				des mots de passe, contrôle des accès et journalisation.
			</p>

			<h2>9. Vos droits</h2>
			<p>
				Conformément au RGPD et à la loi Informatique et Libertés, vous disposez des droits suivants
				:
			</p>
			<ul>
				<li>
					<strong>Droit d'accès :</strong> obtenir une copie des données vous concernant ;
				</li>
				<li>
					<strong>Droit de rectification :</strong> corriger des données inexactes ou incomplètes ;
				</li>
				<li>
					<strong>Droit à l'effacement :</strong> demander la suppression de vos données (« droit à
					l'oubli ») ;
				</li>
				<li>
					<strong>Droit à la limitation :</strong> restreindre le traitement de vos données ;
				</li>
				<li>
					<strong>Droit à la portabilité :</strong> recevoir vos données dans un format structuré ;
				</li>
				<li>
					<strong>Droit d'opposition :</strong> vous opposer au traitement pour motif légitime ;
				</li>
				<li>
					<strong>Droit de retrait du consentement :</strong> retirer votre consentement à tout
					moment.
				</li>
			</ul>
			<p>
				Pour exercer ces droits, contactez notre DPO à :{" "}
				<a href="mailto:williampeynichou@claake.com">williampeynichou@claake.com</a>. Nous
				répondrons dans un délai maximum d'un mois.
			</p>
			<p>
				Vous avez également le droit d'introduire une réclamation auprès de la CNIL (Commission
				Nationale de l'Informatique et des Libertés) : <strong>cnil.fr</strong>.
			</p>

			<h2>10. Cookies</h2>
			<p>
				Pour plus d'informations sur l'utilisation des cookies, consultez notre{" "}
				<a href="/legal/cookies">Politique cookies</a>.
			</p>
		</article>
	);
}
