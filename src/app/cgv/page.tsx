export const metadata = {
  title: 'Conditions Générales de Vente - VTC Paris',
  description: 'Conditions générales de vente pour les services de transport VTC Paris',
}

export default function CGVPage() {
  return (
    <main className="min-h-screen bg-white py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Conditions Générales de Vente
        </h1>

        <div className="prose prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Objet</h2>
            <p className="text-gray-600">
              Les présentes conditions générales de vente (CGV) régissent les relations entre VTC Paris, 
              service de transport de personnes à titre onéreux, et ses clients. Elles s'appliquent à 
              l'ensemble des prestations de transport proposées et commandées via notre site web ou par téléphone.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Services proposés</h2>
            <p className="text-gray-600">
              Nos services comprennent :
            </p>
            <ul className="list-disc pl-6 text-gray-600 mt-4">
              <li>Transferts aéroports (CDG, Orly, Beauvais)</li>
              <li>Transferts gares</li>
              <li>Transport événementiel</li>
              <li>Mise à disposition</li>
              <li>Trajets longue distance</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Réservation et confirmation</h2>
            <p className="text-gray-600">
              La réservation peut être effectuée :
            </p>
            <ul className="list-disc pl-6 text-gray-600 mt-4">
              <li>Via notre site web</li>
              <li>Par téléphone au +33 7 85 65 84 63</li>
              <li>Par email à contact@vtc-transport-conciergerie.fr</li>
            </ul>
            <p className="text-gray-600 mt-4">
              Toute réservation fait l'objet d'une confirmation par email contenant les détails du trajet.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Tarifs et paiement</h2>
            <p className="text-gray-600">
              Les tarifs sont indiqués en euros TTC. Le prix définitif est communiqué lors de la réservation 
              et dépend du type de trajet, de la distance et des services additionnels demandés. Le paiement 
              peut être effectué :
            </p>
            <ul className="list-disc pl-6 text-gray-600 mt-4">
              <li>Par carte bancaire (paiement sécurisé)</li>
              <li>Par virement bancaire (pour les entreprises)</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Annulation et modification</h2>
            <p className="text-gray-600">
              Toute annulation ou modification doit être communiquée au plus tôt :
            </p>
            <ul className="list-disc pl-6 text-gray-600 mt-4">
              <li>Annulation plus de 24h avant : remboursement intégral</li>
              <li>Annulation entre 12h et 24h : facturation de 50% du montant</li>
              <li>Annulation moins de 12h ou non-présentation : facturation intégrale</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Obligations du transporteur</h2>
            <p className="text-gray-600">
              Nous nous engageons à :
            </p>
            <ul className="list-disc pl-6 text-gray-600 mt-4">
              <li>Assurer la ponctualité des services</li>
              <li>Garantir la sécurité et le confort du transport</li>
              <li>Maintenir les véhicules en parfait état</li>
              <li>Respecter la réglementation en vigueur</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Obligations du client</h2>
            <p className="text-gray-600">
              Le client s'engage à :
            </p>
            <ul className="list-disc pl-6 text-gray-600 mt-4">
              <li>Être présent au lieu et à l'heure convenus</li>
              <li>Respecter le véhicule et le chauffeur</li>
              <li>Informer de tout changement dans les meilleurs délais</li>
              <li>Porter la ceinture de sécurité</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Bagages</h2>
            <p className="text-gray-600">
              Les bagages sont acceptés dans la limite de la capacité du véhicule et sous la responsabilité 
              de leur propriétaire. Le chauffeur peut refuser un bagage qui compromettrait la sécurité du transport.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Responsabilité et assurance</h2>
            <p className="text-gray-600">
              Notre responsabilité civile professionnelle est couverte par une assurance spécifique. 
              Les passagers sont couverts pendant toute la durée du transport conformément à la législation 
              en vigueur.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Droit applicable et litiges</h2>
            <p className="text-gray-600">
              Les présentes CGV sont soumises au droit français. En cas de litige, une solution amiable 
              sera recherchée avant toute action judiciaire. À défaut, les tribunaux de Paris seront seuls 
              compétents.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
