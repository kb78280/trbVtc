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
            Nous offrons une gamme complète de services de transport de personnes pour répondre à tous vos besoins de déplacement, à Paris et en France.
            </p>
            
          </div>
        </div>
      </div>

      {/* Services détaillés */}
      <div id="services-detail">
        <ServicePresentation hideHeader={true} />
      </div>

    </main>
  )
}
