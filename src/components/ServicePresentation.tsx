'use client'

import { useState } from 'react'

interface ServicePresentationProps {
  hideHeader?: boolean
}

export default function ServicePresentation({ hideHeader = false }: ServicePresentationProps) {
  const [expandedServices, setExpandedServices] = useState<number[]>([])

  const toggleService = (index: number) => {
    setExpandedServices(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  const services = [
    {
      title: 'Transferts Aéroports',
      description: 'Service de navette vers tous les aéroports parisiens (CDG, Orly, Le Bourget, Beauvais)',
      expandedContent: 'Nos chauffeurs professionnels vous accueillent avec ponctualité et courtoisie. Suivi de vol en temps réel, assistance avec les bagages, et véhicules climatisés pour un confort optimal. Service disponible 24h/24 avec possibilité de réservation à l\'avance ou en urgence.',
      image: '/imgTransfertAirport.jpg',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
        </svg>
      )
    },
    {
      title: 'Trajets Gares',
      description: 'Transport vers toutes les gares parisiennes et de banlieue',
      expandedContent: 'Que ce soit pour Gare du Nord, Gare de Lyon, Saint-Lazare ou toute autre gare parisienne, nous vous garantissons un transport fiable et ponctuel. Idéal pour vos voyages d\'affaires ou personnels, avec prise en charge directe et dépose au plus près de votre destination.',
      image: '/imgTransfertGarde.jpg',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 1-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m6.75 4.5v-3a1.5 1.5 0 0 1 1.5-1.5h3a1.5 1.5 0 0 1 1.5 1.5v3m-6 0h4.5m-4.5 0h-6m0-4.5h1.5m13.5 0h1.5m-16.5 0h5.25" />
        </svg>
      )
    },
    {
      title: 'Événements',
      description: 'Transport pour vos événements professionnels et personnels',
      expandedContent: 'Mariages, séminaires, soirées d\'entreprise, anniversaires... Nous adaptons notre service à vos besoins spécifiques. Véhicules de prestige disponibles, service de groupe, et coordination parfaite pour que votre événement soit une réussite totale.',
      image: '/imgVoitureInterieur.webp',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
        </svg>
      )
    },
    {
      title: 'Mise à Disposition',
      description: 'Chauffeur à votre disposition pour vos déplacements multiples',
      expandedContent: 'Service sur-mesure avec chauffeur dédié pour une demi-journée, journée complète ou plus. Parfait pour les tournées commerciales, visites touristiques, ou déplacements professionnels multiples. Flexibilité totale et tarification adaptée à vos besoins.',
      image: '/imgMiseADispo.jpg',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
      )
    },
    {
      title: 'Trajets Longue Distance',
      description: 'Déplacements dans toute la France avec confort et sécurité',
      expandedContent: 'Voyagez sereinement vers toutes les destinations françaises. Véhicules grand confort, pauses régulières, et chauffeurs expérimentés pour les longs trajets. Alternative premium au train ou à l\'avion, avec service porte-à-porte et flexibilité horaire.',
      image: '/imgLongueDistance.jpg',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
        </svg>
      )
    },
    {
      title: 'Services Premium',
      description: 'Véhicules haut de gamme pour vos déplacements d\'affaires',
      expandedContent: 'Notre flotte premium répond aux exigences les plus élevées. Intérieurs cuir, Wi-Fi, prises USB, eau fraîche, et journaux du jour. Le summum du raffinement pour vos rendez-vous d\'affaires importants.',
      image: '/imgVoitureInterieur.webp',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
        </svg>
      )
    }
  ]

  const advantages = [
    'Chauffeurs professionnels et expérimentés',
    'Véhicules récents et entretenus',
    'Service disponible 24h/24 et 7j/7',
    'Tarifs transparents et compétitifs',
    'Réservation en ligne simple et rapide',
    'Service client réactif',
    'Paiement sécurisé en ligne',
    'Confirmation par SMS et email'
  ]

  return (
    <section id="services" className="py-16 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {!hideHeader && (
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Nos Services
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Un service de transport premium pour tous vos déplacements à Paris et en région parisienne
            </p>
          </div>
        )}

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {services.map((service, index) => (
            <div key={index} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow">
              {/* Image du service */}
              <div className="relative h-48 bg-gray-200">
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              
              {/* Contenu */}
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {service.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {service.description}
                </p>
                
                {/* Contenu étendu */}
                <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  expandedServices.includes(index) 
                    ? 'max-h-96 opacity-100' 
                    : 'max-h-0 opacity-0'
                }`}>
                  <p className="text-gray-600 mb-4 pt-2 border-t border-gray-100">
                    {service.expandedContent}
                  </p>
                </div>
                
                {/* Bouton Voir plus/moins */}
                <button
                  onClick={() => toggleService(index)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 transition-colors duration-200"
                >
                  {expandedServices.includes(index) ? 'Voir moins' : 'Voir plus...'}
                  <svg 
                    className={`h-4 w-4 transition-transform duration-200 ${
                      expandedServices.includes(index) ? 'rotate-180' : ''
                    }`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    strokeWidth="1.5" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Advantages */}
        <div className="bg-blue-50 rounded-2xl p-8 lg:p-12">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Pourquoi nous choisir ?
            </h3>
            <p className="text-gray-600">
              Découvrez les avantages de notre service VTC
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Image */}
            <div className="relative">
              <img
                src="/imgMiseADispo.jpg"
                alt="Chauffeur professionnel VTC"
                className="w-full h-80 object-cover rounded-lg shadow-lg"
                loading="lazy"
              />
            </div>
            
            {/* Avantages */}
            <div>
              <div className="grid grid-cols-1 gap-4">
                {advantages.map((advantage, index) => (
                  <div key={index} className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">{advantage}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <a
              href="/reservation"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Réserver maintenant
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
