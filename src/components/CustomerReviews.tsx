export default function CustomerReviews() {
  const reviews = [
    {
      name: 'Marie Dubois',
      rating: 5,
      comment: 'Service impeccable ! Le chauffeur était ponctuel et très professionnel. Véhicule propre et confortable. Je recommande vivement !',
      date: 'Il y a 2 semaines',
      service: 'Transfert CDG'
    },
    {
      name: 'Pierre Martin',
      rating: 5,
      comment: 'Excellent service pour mes déplacements professionnels. Toujours à l\'heure, chauffeurs courtois. Parfait pour mes clients !',
      date: 'Il y a 1 mois',
      service: 'Mise à disposition'
    },
    {
      name: 'Sophie Laurent',
      rating: 5,
      comment: 'J\'utilise ce service régulièrement pour mes trajets vers les aéroports. Jamais déçue ! Tarifs corrects et service de qualité.',
      date: 'Il y a 3 semaines',
      service: 'Transfert Orly'
    },
    {
      name: 'Jean-Claude Moreau',
      rating: 5,
      comment: 'Service au top pour notre mariage ! Le chauffeur nous a attendu et était très patient. Véhicule magnifique !',
      date: 'Il y a 1 semaine',
      service: 'Événement'
    },
    {
      name: 'Isabelle Petit',
      rating: 5,
      comment: 'Réservation facile en ligne, confirmation rapide. Le trajet s\'est parfaitement déroulé. Merci pour votre professionnalisme !',
      date: 'Il y a 4 jours',
      service: 'Transfert gare'
    },
    {
      name: 'Thomas Rousseau',
      rating: 5,
      comment: 'Service irréprochable ! Chauffeur très sympa qui connaît bien Paris. Trajet agréable et sans stress.',
      date: 'Il y a 1 semaine',
      service: 'Trajet ville'
    }
  ]

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <svg
        key={index}
        className={`h-4 w-4 ${index < rating ? 'text-yellow-400' : 'text-gray-300'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Avis Clients
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Découvrez ce que nos clients pensent de notre service
          </p>
          
          {/* Stats */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="text-3xl font-bold text-blue-600">4.9/5</div>
              <div className="text-sm text-gray-600 mt-1">Note moyenne</div>
              <div className="flex justify-center mt-2">
                {renderStars(5)}
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="text-3xl font-bold text-blue-600">500+</div>
              <div className="text-sm text-gray-600 mt-1">Clients satisfaits</div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="text-3xl font-bold text-blue-600">98%</div>
              <div className="text-sm text-gray-600 mt-1">Taux de ponctualité</div>
            </div>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review, index) => (
            <div key={index} className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {review.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{review.name}</p>
                  <div className="flex items-center">
                    {renderStars(review.rating)}
                  </div>
                </div>
              </div>
              
              <blockquote className="text-gray-700 mb-4">
                &ldquo;{review.comment}&rdquo;
              </blockquote>
              
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {review.service}
                </span>
                <span>{review.date}</span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-6">
            Rejoignez nos clients satisfaits !
          </p>
          <a
            href="#reservation"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Réserver votre course
          </a>
        </div>
      </div>
    </section>
  )
}
