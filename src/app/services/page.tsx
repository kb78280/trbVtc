import ServicePresentation from '@/components/ServicePresentation'

export const metadata = {
  title: 'Services - VTC Paris',
  description: 'Découvrez tous nos services de transport VTC à Paris',
}

export default function ServicesPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section avec image de background */}
      <div className="relative bg-blue-900 text-white py-16 lg:py-24">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/imgTransfertAirport.jpg)',
          }}
        ></div>
        <div className="absolute inset-0 bg-black opacity-60"></div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold lg:text-5xl">Nos Services</h1>
            <p className="mt-6 text-xl text-blue-100 max-w-2xl mx-auto">
              Un service de transport premium pour tous vos besoins de déplacement à Paris et en région parisienne
            </p>
            <div className="mt-8">
              <a
                href="#services-detail"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-900 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
              >
                Découvrir nos services
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Services détaillés */}
      <div id="services-detail">
        <ServicePresentation />
      </div>

      {/* Section supplémentaire avec témoignage */}
      <div className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Pourquoi choisir nos services ?
              </h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-md bg-blue-500 text-white">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Ponctualité garantie</h3>
                    <p className="text-gray-600">Nous nous engageons à respecter vos horaires avec une ponctualité irréprochable.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-md bg-blue-500 text-white">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Véhicules premium</h3>
                    <p className="text-gray-600">Flotte de véhicules haut de gamme, récents et parfaitement entretenus.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-md bg-blue-500 text-white">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Chauffeurs expérimentés</h3>
                    <p className="text-gray-600">Professionnels formés, courtois et parfaitement formés à la conduite urbaine.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <img
                src="/imgMiseADispo.jpg"
                alt="Service VTC professionnel"
                className="w-full h-96 object-cover rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
