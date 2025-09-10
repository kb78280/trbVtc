'use client'

import { useState, useEffect } from 'react'

type ServiceType = 'transfert' | 'mise-a-disposition'

export default function ReservationForm() {
  const [mounted, setMounted] = useState(false)
  const [serviceType, setServiceType] = useState<ServiceType>('transfert')
  const [formData, setFormData] = useState({
    depart: '',
    arrivee: '',
    date: '',
    heure: '',
    passagers: '1',
    duree: '2',
    nom: '',
    prenom: '',
    telephone: '',
    email: '',
    commentaires: ''
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Logique pour calculer le prix et rediriger
    console.log('Données du formulaire:', { serviceType, ...formData })
    alert('Redirection vers le calcul du prix...')
  }

  if (!mounted) {
    return (
      <section id="reservation" className="py-12 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
              Formulaire de réservation
            </h2>
            <div className="animate-pulse">
              <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-96 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-64 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-12 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="reservation" className="py-12 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Formulaire de réservation
          </h2>
          
          {/* Choix du service */}
          <div className="mb-8">
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setServiceType('transfert')}
                className={`p-4 rounded-lg border-2 text-center transition-colors ${
                  serviceType === 'transfert'
                    ? 'border-blue-600 bg-blue-50 text-blue-900'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                <div className="font-semibold">Transfert</div>
                <div className="text-sm mt-1">Point A vers Point B</div>
              </button>
              <button
                type="button"
                onClick={() => setServiceType('mise-a-disposition')}
                className={`p-4 rounded-lg border-2 text-center transition-colors ${
                  serviceType === 'mise-a-disposition'
                    ? 'border-blue-600 bg-blue-50 text-blue-900'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                <div className="font-semibold">Mise à disposition</div>
                <div className="text-sm mt-1">Chauffeur à disposition</div>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations de trajet */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations de trajet</h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="depart" className="block text-sm font-medium text-gray-700 mb-1">
                    Lieu de départ *
                  </label>
                  <input
                    type="text"
                    id="depart"
                    name="depart"
                    required
                    value={formData.depart}
                    onChange={handleInputChange}
                    placeholder="Adresse de départ"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3"
                  />
                </div>

                {serviceType === 'transfert' && (
                  <div>
                    <label htmlFor="arrivee" className="block text-sm font-medium text-gray-700 mb-1">
                      Lieu d'arrivée *
                    </label>
                    <input
                      type="text"
                      id="arrivee"
                      name="arrivee"
                      required
                      value={formData.arrivee}
                      onChange={handleInputChange}
                      placeholder="Adresse d'arrivée"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                      Date *
                    </label>
                    <input
                      type="date"
                      id="date"
                      name="date"
                      required
                      value={formData.date}
                      onChange={handleInputChange}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3"
                    />
                  </div>
                  <div>
                    <label htmlFor="heure" className="block text-sm font-medium text-gray-700 mb-1">
                      Heure *
                    </label>
                    <input
                      type="time"
                      id="heure"
                      name="heure"
                      required
                      value={formData.heure}
                      onChange={handleInputChange}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="passagers" className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de passagers
                    </label>
                    <select
                      id="passagers"
                      name="passagers"
                      value={formData.passagers}
                      onChange={handleInputChange}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                        <option key={num} value={num}>{num} passager{num > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>

                  {serviceType === 'mise-a-disposition' && (
                    <div>
                      <label htmlFor="duree" className="block text-sm font-medium text-gray-700 mb-1">
                        Durée (heures)
                      </label>
                      <select
                        id="duree"
                        name="duree"
                        value={formData.duree}
                        onChange={handleInputChange}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 12, 24].map(num => (
                          <option key={num} value={num}>{num} heure{num > 1 ? 's' : ''}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Informations personnelles */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations personnelles</h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="prenom" className="block text-sm font-medium text-gray-700 mb-1">
                      Prénom *
                    </label>
                    <input
                      type="text"
                      id="prenom"
                      name="prenom"
                      required
                      value={formData.prenom}
                      onChange={handleInputChange}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3"
                    />
                  </div>
                  <div>
                    <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-1">
                      Nom *
                    </label>
                    <input
                      type="text"
                      id="nom"
                      name="nom"
                      required
                      value={formData.nom}
                      onChange={handleInputChange}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="telephone" className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone *
                  </label>
                  <input
                    type="tel"
                    id="telephone"
                    name="telephone"
                    required
                    value={formData.telephone}
                    onChange={handleInputChange}
                    placeholder="06 12 34 56 78"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="votre@email.com"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3"
                  />
                </div>

                <div>
                  <label htmlFor="commentaires" className="block text-sm font-medium text-gray-700 mb-1">
                    Commentaires ou demandes spéciales
                  </label>
                  <textarea
                    id="commentaires"
                    name="commentaires"
                    rows={3}
                    value={formData.commentaires}
                    onChange={handleInputChange}
                    placeholder="Informations supplémentaires..."
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3"
                  />
                </div>
              </div>
            </div>

            {/* Bouton de soumission */}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-4 px-6 rounded-md text-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Voir le prix
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}
