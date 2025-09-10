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
              <p className="text-lg text-gray-600 mb-6">
                Depuis plus de 10 ans, VTC Paris s&apos;est imposé comme une référence dans le transport de personnes à Paris et en région parisienne. 
                Nous avons bâti notre réputation sur la qualité de service, la ponctualité et la satisfaction de nos clients.
              </p>
              <p className="text-gray-600 mb-6">
                Notre équipe de chauffeurs professionnels partage les mêmes valeurs : excellence du service, respect du client et passion pour leur métier. 
                Chaque course est pour nous l&apos;occasion de confirmer votre confiance.
              </p>
              <p className="text-gray-600">
                Que ce soit pour un transfert vers l&apos;aéroport, un déplacement professionnel ou un événement spécial, 
                nous mettons tout en œuvre pour que votre voyage soit une expérience agréable et sans stress.
              </p>
            </div>
            
            <div className="bg-gray-50 p-8 rounded-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Nos chiffres</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">10+</div>
                  <div className="text-sm text-gray-600">Années d'expérience</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">500+</div>
                  <div className="text-sm text-gray-600">Clients satisfaits</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">15</div>
                  <div className="text-sm text-gray-600">Véhicules</div>
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
                <h2 className="text-3xl font-bold text-gray-900 mb-8">
                  Notre flotte
                </h2>
                
                <div className="space-y-6">
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Berlines Premium</h3>
                    <p className="text-gray-600 mb-4">
                      Mercedes Classe E, BMW Série 5, Audi A6 - Parfaites pour vos déplacements professionnels
                    </p>
                    <ul className="text-sm text-gray-500 space-y-1">
                      <li>• 4 passagers</li>
                      <li>• Cuir, climatisation</li>
                      <li>• WiFi gratuit</li>
                    </ul>
                  </div>

                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Monospaces</h3>
                    <p className="text-gray-600 mb-4">
                      Mercedes Classe V, Volkswagen Caravelle - Idéales pour les groupes
                    </p>
                    <ul className="text-sm text-gray-500 space-y-1">
                      <li>• 6-8 passagers</li>
                      <li>• Espace bagages</li>
                      <li>• Confort maximal</li>
                    </ul>
                  </div>

                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Véhicules Luxe</h3>
                    <p className="text-gray-600 mb-4">
                      Mercedes Classe S, BMW Série 7 - Pour vos événements spéciaux
                    </p>
                    <ul className="text-sm text-gray-500 space-y-1">
                      <li>• Luxe et prestige</li>
                      <li>• Service premium</li>
                      <li>• Équipements haut de gamme</li>
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
