export const metadata = {
  title: 'À propos - VTC Paris',
  description: 'Découvrez notre histoire et nos valeurs',
}

export default function AProposPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="bg-blue-900 text-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold">À propos de nous</h1>
            <p className="mt-4 text-xl text-blue-100">
              Votre partenaire de confiance pour tous vos déplacements
            </p>
          </div>
        </div>
      </div>

      <div className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Notre histoire
              </h2>
              <p className="text-gray-600 mb-6">
                Nous sommes une entreprise de transport de personnes spécialisée dans le transport en toute sécurité et en tout confort de nos clients. 
                Fondés en 2020, nous avons bâti notre réputation en offrant un service de qualité supérieure dans notre secteur.
              </p>
              <p className="text-gray-600 mb-6">
                Notre équipe de chauffeurs est composée de professionnels expérimentés et formés pour garantir votre sécurité et votre confort pendant votre trajet. 
                Nous sommes fiers de notre service clientèle exceptionnel et nous nous efforçons toujours de dépasser les attentes de nos clients.
              </p>
              <p className="text-gray-600">
                Nous proposons une large gamme de services : transferts depuis et vers les aéroports, les gares, transport pour les événements, 
                visites touristiques et bien plus encore. Quel que soit votre besoin de transport, notre équipe est là pour vous aider.
              </p>
            </div>
            
            <div className="bg-gray-50 p-8 rounded-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Nos chiffres</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">2020</div>
                  <div className="text-sm text-gray-600">Année de création</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">1000+</div>
                  <div className="text-sm text-gray-600">Clients satisfaits</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">2</div>
                  <div className="text-sm text-gray-600">Véhicules premium</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">24/7</div>
                  <div className="text-sm text-gray-600">Service disponible</div>
                </div>
              </div>
            </div>
          </div>

          {/* Nos valeurs */}
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Nos valeurs
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.623 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Fiabilité</h3>
                <p className="text-gray-600">
                  Nous nous engageons à être à l&apos;heure et à respecter nos engagements. 
                  Votre confiance est notre priorité absolue.
                </p>
              </div>

              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Excellence</h3>
                <p className="text-gray-600">
                  Nous visons l'excellence dans chaque détail : véhicules impeccables, 
                  service irréprochable et attention personnalisée.
                </p>
              </div>

              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Service client</h3>
                <p className="text-gray-600">
                  Votre satisfaction est notre récompense. Nous sommes à votre écoute 
                  pour répondre à tous vos besoins.
                </p>
              </div>
            </div>
          </div>

          {/* La sécurité */}
          <div className="mt-16">
            <div className="bg-blue-900 text-white rounded-2xl p-8 lg:p-12">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4">
                  La sécurité, notre priorité absolue
                </h2>
                <p className="text-blue-100 text-lg max-w-3xl mx-auto">
                  Nous prenons très au sérieux la sécurité de nos clients et nous sommes fiers de respecter les normes les plus strictes en matière de sécurité routière.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="bg-blue-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <svg className="h-8 w-8 text-blue-200" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-3">Chauffeurs formés</h3>
                  <p className="text-blue-100">
                    Tous nos chauffeurs sont formés pour conduire en toute sécurité et possèdent toutes les certifications requises.
                  </p>
                </div>

                <div className="text-center">
                  <div className="bg-blue-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <svg className="h-8 w-8 text-blue-200" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-3">Maintenance rigoureuse</h3>
                  <p className="text-blue-100">
                    Nos véhicules sont régulièrement inspectés et entretenus pour garantir leur sécurité et leur fiabilité.
                  </p>
                </div>

                <div className="text-center">
                  <div className="bg-blue-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <svg className="h-8 w-8 text-blue-200" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.623 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-3">Assurance complète</h3>
                  <p className="text-blue-100">
                    Couverture d'assurance complète pour vous garantir une tranquillité d'esprit totale durant vos trajets.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Notre flotte */}
          <div className="mt-16 bg-gray-50 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              {/* Image */}
              <div className="relative h-64 lg:h-auto">
                <img
                  src="/imgVoitureInterieur.webp"
                  alt="Intérieur luxueux de nos véhicules VTC"
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Contenu */}
              <div className="p-8 lg:p-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  La qualité de notre flotte
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                  Nous sommes spécialisés dans le transport en toute sécurité et en tout confort de nos clients. 
                  Nous offrons un service de qualité supérieure avec une flotte de véhicules premium.
                </p>
                
                <div className="space-y-6">
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Berlines Premium</h3>
                    <p className="text-gray-600 mb-4">
                      Véhicules haut de gamme, récents et parfaitement entretenus pour vos déplacements professionnels et personnels.
                    </p>
                    <ul className="text-sm text-gray-500 space-y-1">
                      <li>• 3 passagers confortablement installés</li>
                      <li>• Intérieurs cuir, climatisation automatique</li>
                      <li>• WiFi gratuit et prises USB</li>
                      <li>• Inspection régulière garantie</li>
                    </ul>
                  </div>

                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Monospaces</h3>
                    <p className="text-gray-600 mb-4">
                      Véhicules spacieux idéaux pour les groupes, avec un grand espace bagages et un confort maximal.
                    </p>
                    <ul className="text-sm text-gray-500 space-y-1">
                      <li>• 6-8 passagers</li>
                      <li>• Grand espace bagages</li>
                      <li>• Confort premium pour tous</li>
                      <li>• Parfait pour les événements</li>
                    </ul>
                  </div>

                  
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
