export const metadata = {
  title: 'Mentions légales - VTC Paris',
  description: 'Mentions légales et informations juridiques de VTC Paris',
}

export default function MentionsLegalesPage() {
  return (
    <main className="min-h-screen bg-white py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Mentions légales
        </h1>

        <div className="prose prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Éditeur du site</h2>
            <p className="text-gray-600">
              <strong>Nom de la structure :</strong> VTC Paris<br />
              <strong>Forme juridique :</strong> Auto-entrepreneur<br />
              <strong>Adresse :</strong> Paris et région parisienne<br />
              <strong>Téléphone :</strong> +33 7 85 65 84 63<br />
              <strong>Email :</strong> contact@vtc-transport-conciergerie.fr<br />
              <strong>Numéro SIRET :</strong> <span className="text-red-600">[12345678900001]</span><br />
              <strong>Numéro d'inscription RCS :</strong> <span className="text-red-600">[Paris 123456789]</span><br />
              <strong>Numéro de TVA intracommunautaire :</strong> <span className="text-red-600">[FR12345678900]</span>
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Activité professionnelle</h2>
            <p className="text-gray-600">
              Transport de personnes à titre onéreux avec des véhicules de tourisme (VTC)<br />
              Service disponible 24h/24 et 7j/7<br />
              <strong>Numéro de la carte professionnelle VTC :</strong> <span className="text-red-600">[VTC-2024-12345]</span><br />
              <strong>Autorité de délivrance :</strong> <span className="text-red-600">[Préfecture de Police de Paris]</span><br />
              <strong>Assurance responsabilité civile professionnelle :</strong> <span className="text-red-600">[AXA France IARD - Contrat n°1234567890]</span>
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Hébergement</h2>
            <p className="text-gray-600">
              <strong>Hébergeur du site :</strong> Vercel Inc.<br />
              <strong>Adresse :</strong> 340 S Lemon Ave #4133 Walnut, CA 91789, USA<br />
              <strong>Site web :</strong> <a href="https://vercel.com" className="text-blue-600 hover:text-blue-800">https://vercel.com</a>
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Propriété intellectuelle</h2>
            <p className="text-gray-600">
              Tous les éléments (textes, photographies, graphismes, logos…) présents sur ce site sont protégés 
              par le droit d'auteur, le droit des marques et toutes les législations françaises et internationales 
              applicables. Toute reproduction, représentation, modification, publication, adaptation de tout ou 
              partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite, sauf 
              autorisation écrite préalable de l'éditeur.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Données personnelles</h2>
            <p className="text-gray-600">
              Les informations recueillies via notre formulaire de réservation sont utilisées uniquement dans 
              le cadre de la relation commerciale entre VTC Paris et ses clients. Conformément à la loi 
              "informatique et libertés" du 6 janvier 1978 modifiée et au Règlement européen n°2016/679/UE 
              du 27 avril 2016, vous bénéficiez d'un droit d'accès, de rectification, de portabilité et 
              d'effacement de vos données. Vous pouvez exercer ces droits en nous contactant par email à 
              contact@vtc-transport-conciergerie.fr.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Responsabilité</h2>
            <p className="text-gray-600">
              L'éditeur s'efforce de fournir des informations précises mais ne saurait garantir l'exactitude, 
              la complétude des informations diffusées sur le site. En conséquence, l'éditeur décline toute 
              responsabilité pour les erreurs ou omissions dans les informations diffusées sur le site.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Liens hypertextes</h2>
            <p className="text-gray-600">
              La création de liens vers ce site est autorisée sous réserve qu'ils ouvrent une nouvelle fenêtre 
              et que la page liée soit affichée dans son intégralité, sans qu'il soit possible d'y associer 
              notamment des éléments graphiques altérant l'esprit du site ou sa présentation visuelle.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
