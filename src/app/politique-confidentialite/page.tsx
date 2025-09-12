export const metadata = {
  title: 'Politique de confidentialité - VTC Paris',
  description: 'Politique de confidentialité et protection des données personnelles de VTC Paris',
}

export default function PolitiqueConfidentialitePage() {
  return (
    <main className="min-h-screen bg-white py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Politique de confidentialité
        </h1>

        <div className="prose prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Introduction</h2>
            <p className="text-gray-600">
              VTC Paris s'engage à protéger la vie privée des utilisateurs de son site web et de ses services. 
              Cette politique de confidentialité explique comment nous collectons, utilisons et protégeons vos 
              données personnelles conformément au Règlement Général sur la Protection des Données (RGPD).
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Données collectées</h2>
            <p className="text-gray-600">
              Nous collectons uniquement les données nécessaires à la fourniture de nos services :
            </p>
            <ul className="list-disc pl-6 text-gray-600 mt-4">
              <li>Informations de contact (nom, prénom, téléphone, email)</li>
              <li>Adresses de prise en charge et de destination</li>
              <li>Détails de la réservation (date, heure, type de service)</li>
              <li>Informations de paiement (traitées de manière sécurisée par notre prestataire de paiement)</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Utilisation des données</h2>
            <p className="text-gray-600">
              Vos données sont utilisées pour :
            </p>
            <ul className="list-disc pl-6 text-gray-600 mt-4">
              <li>Traiter et confirmer vos réservations</li>
              <li>Vous contacter concernant votre transport</li>
              <li>Améliorer nos services</li>
              <li>Respecter nos obligations légales</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Protection des données</h2>
            <p className="text-gray-600">
              Nous mettons en œuvre des mesures de sécurité appropriées pour protéger vos données contre tout 
              accès, modification, divulgation ou destruction non autorisés. L'accès aux données est strictement 
              limité aux employés qui en ont besoin pour l'exécution de leur mission.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Conservation des données</h2>
            <p className="text-gray-600">
              Nous conservons vos données personnelles uniquement pendant la durée nécessaire aux finalités 
              pour lesquelles elles ont été collectées, dans le respect des délais de prescription légale :
            </p>
            <ul className="list-disc pl-6 text-gray-600 mt-4">
              <li>Données de réservation : 3 ans après la dernière utilisation</li>
              <li>Données de facturation : 10 ans (obligation légale)</li>
              <li>Données de contact : jusqu'à votre demande de suppression</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Vos droits</h2>
            <p className="text-gray-600">
              Conformément au RGPD, vous disposez des droits suivants :
            </p>
            <ul className="list-disc pl-6 text-gray-600 mt-4">
              <li>Droit d'accès à vos données</li>
              <li>Droit de rectification</li>
              <li>Droit à l'effacement (droit à l'oubli)</li>
              <li>Droit à la limitation du traitement</li>
              <li>Droit à la portabilité des données</li>
              <li>Droit d'opposition</li>
            </ul>
            <p className="text-gray-600 mt-4">
              Pour exercer ces droits, contactez-nous à : contact@vtc-transport-conciergerie.fr
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Sous-traitants</h2>
            <p className="text-gray-600">
              Nous faisons appel à des sous-traitants pour certaines opérations :
            </p>
            <ul className="list-disc pl-6 text-gray-600 mt-4">
              <li>Hébergement : Vercel (États-Unis, avec garanties appropriées)</li>
              <li>Paiement : Prestataire de paiement sécurisé</li>
              <li>Email : Service d'envoi d'emails sécurisé</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Modifications</h2>
            <p className="text-gray-600">
              Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment. 
              Les modifications prennent effet dès leur publication sur le site. Nous vous encourageons à 
              consulter régulièrement cette page pour rester informé des éventuelles mises à jour.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
