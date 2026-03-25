export default function MentionsLegalesPage() {
	return (
		<article className="prose prose-neutral dark:prose-invert max-w-none">
			<p className="text-sm text-muted-foreground">Dernière mise à jour : mars 2026</p>

			<h1>Mentions légales</h1>

			<h2>1. Éditeur du site</h2>
			<p>
				Le site <strong>claake.com</strong> est édité par la société <strong>Claake</strong>,{" "}
				[FORME_JURIDIQUE] au capital de <strong>[CAPITAL_SOCIAL]</strong> euros.
			</p>
			<ul>
				<li>
					<strong>Siège social :</strong> [ADRESSE_SIÈGE]
				</li>
				<li>
					<strong>SIRET :</strong> [SIRET]
				</li>
				<li>
					<strong>RCS :</strong> [RCS_NUMÉRO]
				</li>
				<li>
					<strong>TVA intracommunautaire :</strong> [TVA_INTRA]
				</li>
				<li>
					<strong>Directeur de la publication :</strong> [REPRÉSENTANT_LÉGAL]
				</li>
				<li>
					<strong>Email de contact :</strong>{" "}
					<a href="mailto:claake@contact.com">claake@contact.com</a>
				</li>
			</ul>

			<h2>2. Hébergement</h2>
			<p>
				Le site est hébergé par <strong>Vercel Inc.</strong>, dont le siège social est situé au 340
				Pine Street, Suite 701, San Francisco, CA 94104, États-Unis. Site web :{" "}
				<a href="https://vercel.com" target="_blank" rel="noopener noreferrer">
					vercel.com
				</a>
				.
			</p>
			<p>
				La base de données est hébergée par <strong>Supabase Inc.</strong>, 970 Toa Payoh North,
				#07-04, Singapore 318992. Site web :{" "}
				<a href="https://supabase.com" target="_blank" rel="noopener noreferrer">
					supabase.com
				</a>
				.
			</p>

			<h2>3. Propriété intellectuelle</h2>
			<p>
				L'ensemble des éléments constituant le site Claake (textes, graphismes, logiciels, images,
				sons, plans, logos, marques, etc.) est la propriété exclusive de Claake ou fait l'objet
				d'une autorisation d'utilisation. Ces éléments sont protégés par les lois relatives à la
				propriété intellectuelle.
			</p>
			<p>
				Toute reproduction, représentation, modification, publication ou adaptation de tout ou
				partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite
				sans l'autorisation préalable et écrite de Claake, sauf disposition légale contraire.
			</p>
			<p>
				Les agents publiés sur la plateforme par des développeurs tiers restent la propriété
				intellectuelle de leurs auteurs respectifs, conformément aux Conditions d'utilisation et aux
				Conditions développeur acceptées lors de la publication.
			</p>

			<h2>4. Marque</h2>
			<p>
				La marque <strong>Claake</strong> et son logo sont des marques déposées de Claake. Toute
				utilisation non autorisée est strictement interdite.
			</p>

			<h2>5. Limitation de responsabilité</h2>
			<p>
				Claake s'efforce d'assurer l'exactitude et la mise à jour des informations diffusées sur le
				site. Toutefois, Claake ne garantit pas que les informations soient exactes, complètes,
				actuelles ou non trompeuses.
			</p>
			<p>
				Claake ne saurait être tenue responsable des dommages directs ou indirects résultant de
				l'accès ou de l'utilisation du site, notamment d'une panne, d'une interruption, d'un virus
				informatique ou de toute défaillance technique.
			</p>

			<h2>6. Liens hypertextes</h2>
			<p>
				Le site Claake peut contenir des liens vers des sites tiers. Claake ne contrôle pas ces
				sites et décline toute responsabilité quant à leur contenu ou à leur politique de
				confidentialité.
			</p>

			<h2>7. Droit applicable</h2>
			<p>
				Les présentes mentions légales sont soumises au droit français. En cas de litige, les
				tribunaux français seront seuls compétents.
			</p>

			<h2>8. Contact</h2>
			<p>
				Pour toute question relative au site ou aux présentes mentions légales, vous pouvez nous
				contacter à l'adresse : <a href="mailto:claake@contact.com">claake@contact.com</a>
			</p>
		</article>
	);
}
