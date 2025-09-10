'use client'

import { useState } from 'react'
import OptimizedImage from '@/components/OptimizedImage'

const metadata = {
  title: 'Galerie - VTC Paris',
  description: 'Découvrez notre flotte de véhicules et nos services en images',
}

interface GalleryImage {
  src: string
  alt: string
  title: string
  category: string
}

export default function GaleriePage() {
  const [selectedCategory, setSelectedCategory] = useState('all')

  const images: GalleryImage[] = [
    {
      src: '/imgAccueil.webp',
      alt: 'Service VTC Paris - Accueil',
      title: 'Notre service VTC à Paris',
      category: 'general'
    },
    {
      src: '/imgTransfertAirport.jpg',
      alt: 'Transfert aéroport VTC',
      title: 'Transferts vers les aéroports',
      category: 'transfert'
    },
    {
      src: '/imgTransfertGarde.jpg',
      alt: 'Transfert gare VTC',
      title: 'Transferts vers les gares',
      category: 'transfert'
    },
    {
      src: '/imgMiseADispo.jpg',
      alt: 'Mise à disposition chauffeur VTC',
      title: 'Mise à disposition',
      category: 'service'
    },
    {
      src: '/imgLongueDistance.jpg',
      alt: 'Trajet longue distance VTC',
      title: 'Trajets longue distance',
      category: 'service'
    },
    {
      src: '/imgVoitureInterieur.webp',
      alt: 'Intérieur luxueux véhicule VTC',
      title: 'Intérieur de nos véhicules',
      category: 'vehicule'
    }
  ]

  const categories = [
    { id: 'all', name: 'Tout voir' },
    { id: 'general', name: 'Général' },
    { id: 'transfert', name: 'Transferts' },
    { id: 'service', name: 'Services' },
    { id: 'vehicule', name: 'Véhicules' }
  ]

  const filteredImages = selectedCategory === 'all' 
    ? images 
    : images.filter(img => img.category === selectedCategory)

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative bg-blue-900 text-white py-16">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/imgVoitureInterieur.webp)',
          }}
        ></div>
        <div className="absolute inset-0 bg-black opacity-60"></div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold lg:text-5xl">Galerie</h1>
            <p className="mt-4 text-xl text-blue-100 max-w-2xl mx-auto">
              Découvrez notre flotte de véhicules et nos services en images
            </p>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-gray-50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Galerie */}
      <div className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredImages.map((image, index) => (
              <div key={index} className="group">
                <div className="relative aspect-[4/3] rounded-lg overflow-hidden shadow-md group-hover:shadow-xl transition-shadow duration-300">
                  <OptimizedImage
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-full"
                    loading={index < 6 ? 'eager' : 'lazy'}
                    priority={index < 3}
                  />
                  <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-40 transition-opacity duration-300"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <h3 className="text-lg font-semibold">{image.title}</h3>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredImages.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Aucune image trouvée pour cette catégorie.</p>
            </div>
          )}
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-blue-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Prêt à réserver votre course ?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Découvrez par vous-même la qualité de nos services et le confort de nos véhicules.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/reservation"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Réserver maintenant
            </a>
            <a
              href="/contact"
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Nous contacter
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}
