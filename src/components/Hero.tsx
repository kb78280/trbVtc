export default function Hero() {
  return (
    <div className="relative bg-gradient-to-br from-blue-900 to-blue-700 text-white min-h-[80vh] flex items-center">
      {/* Image de background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/imgAccueil.webp)',
        }}
      ></div>
      {/* Overlay sombre pour la lisibilité du texte */}
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:py-24 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Réserver votre chauffeur VTC à Paris
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-blue-100 sm:text-xl">
            Déplacez-vous en toute sécurité et confort avec notre service de transport de personnes à Paris et dans toute la France
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <a
              href="#reservation"
              className="rounded-md bg-white px-6 py-3 text-base font-semibold text-blue-900 shadow-sm hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Réserver maintenant
            </a>
            <a
              href="#services"
              className="text-base font-semibold leading-6 text-white hover:text-blue-100"
            >
              Découvrir nos services <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
        
        {/* Features */}
        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-semibold">Ponctualité</h3>
            <p className="mt-2 text-sm text-blue-100">Service fiable et ponctuel pour tous vos déplacements</p>
          </div>
          
          <div className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.623 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-semibold">Sécurité</h3>
            <p className="mt-2 text-sm text-blue-100">Chauffeurs professionnels et véhicules assurés</p>
          </div>
          
          <div className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-semibold">Confort</h3>
            <p className="mt-2 text-sm text-blue-100">Véhicules haut de gamme pour votre confort</p>
          </div>
        </div>
      </div>
    </div>
  )
}
