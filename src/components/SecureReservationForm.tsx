'use client'

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import DepartureAutocomplete from './DepartureAutocomplete'
import ArrivalAutocomplete from './ArrivalAutocomplete'
import EtapeAutocomplete from './EtapeAutocomplete'
import InteractiveMap from './InteractiveMap'
import StripePaymentForm from './StripePaymentForm'
import { CSRFProtection } from '@/lib/security'

const reservationSchema = z.object({
  serviceType: z.enum(['transfert', 'mise-a-disposition']),
  vehicleType: z.enum(['berline', 'van']),
  depart: z.string().min(1, 'Le lieu de départ est requis'),
  arrivee: z.string().optional(),
  duree: z.string().optional(),
  dateReservation: z.string().min(1, 'La date est requise'),
  heureReservation: z.string().min(1, 'L\'heure est requise'),
  prenom: z.string().min(1, 'Le prénom est requis'),
  nom: z.string().min(1, 'Le nom est requis'),
  telephone: z.string().min(10, 'Le numéro de téléphone est requis'),
  email: z.string().email('L\'email n\'est pas valide'),
  commentaires: z.string().optional(),
  methodePaiement: z.enum(['immediate', 'sur-place']),
  accepteConditions: z.boolean().refine(val => val === true, 'Vous devez accepter les conditions')
})

type ReservationFormData = z.infer<typeof reservationSchema>

export default function SecureReservationForm() {
  const [serviceType, setServiceType] = useState<'transfert' | 'mise-a-disposition'>('transfert')
  const [vehicleType, setVehicleType] = useState<'berline' | 'van'>('berline')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [csrfToken, setCsrfToken] = useState('')

  // États pour Google Maps
  const [originPlace, setOriginPlace] = useState<google.maps.places.PlaceResult | null>(null)
  const [destinationPlace, setDestinationPlace] = useState<google.maps.places.PlaceResult | null>(null)
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null)

  // États pour les étapes
  const [etapes, setEtapes] = useState<Array<{id: number, value: string}>>([{id: 0, value: ''}])
  const [etapesPlaces, setEtapesPlaces] = useState<Array<google.maps.places.PlaceResult | null>>([null])
  const [nextEtapeId, setNextEtapeId] = useState(1)

  // Références pour les valeurs d'adresses
  const departValueRef = useRef('')
  const arriveeValueRef = useRef('')

  // États pour l'autocomplete
  const [isDepartAutocompleted, setIsDepartAutocompleted] = useState(false)
  const [isArriveeAutocompleted, setIsArriveeAutocompleted] = useState(false)

  // Clés pour forcer le re-render des autocomplete
  const [departKey, setDepartKey] = useState(0)
  const [arriveeKey, setArriveeKey] = useState(0)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm<ReservationFormData>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      serviceType: 'transfert',
      vehicleType: 'berline',
      methodePaiement: 'immediate'
    }
  })

  // Fonction simple pour calculer le prix - PAS de useCallback
  // Valeurs watchées stables
  const methodePaiement = watch('methodePaiement') || 'immediate'
  const duree = parseFloat(watch('duree') || '2')

  const calculatePrice = () => {
    if (serviceType === 'transfert') {
      // Règle transfert: 1,49€/km + 10% TVA + 1,45€ frais Stripe si paiement immédiat
      if (!routeInfo?.distance) return null
      
      // Extraire la distance en km (format: "X.X km")
      const distanceMatch = routeInfo.distance.match(/(\d+\.?\d*)/);
      if (!distanceMatch) return null
      
      const distanceKm = parseFloat(distanceMatch[1])
      const basePrice = distanceKm * 1.49
      const tva = basePrice * 0.10
      const stripeFees = methodePaiement === 'immediate' ? 1.45 : 0
      const totalHT = basePrice + stripeFees
      const totalTTC = basePrice + tva + stripeFees
      
      return {
        basePrice: Math.round(basePrice * 100) / 100,
        tva: Math.round(tva * 100) / 100,
        stripeFees,
        totalHT: Math.round(totalHT * 100) / 100,
        totalTTC: Math.round(totalTTC * 100) / 100,
        distance: distanceKm
      }
    } else {
      // Règle mise à disposition: 65€/h + 20% TVA + 1,45€ frais Stripe si paiement immédiat
      const basePrice = duree * 65
      const tva = basePrice * 0.20
      const stripeFees = methodePaiement === 'immediate' ? 1.45 : 0
      const totalHT = basePrice + stripeFees
      const totalTTC = basePrice + tva + stripeFees
      
      return {
        basePrice: Math.round(basePrice * 100) / 100,
        tva: Math.round(tva * 100) / 100,
        stripeFees,
        totalHT: Math.round(totalHT * 100) / 100,
        totalTTC: Math.round(totalTTC * 100) / 100,
        duration: duree
      }
    }
  }

  // Calculer le prix à chaque render - simple et direct
  const priceBreakdown = calculatePrice()

  // Callback stable pour recevoir les données de route
  const handleRouteCalculated = useCallback((distance: string, duration: string) => {
    setRouteInfo({ distance, duration })
  }, [])

  // Tableau waypoints stable pour éviter les re-renders
  const emptyWaypoints = useMemo(() => [], [])

  // Fonctions pour gérer les étapes
  const addEtape = () => {
    if (etapes.length < 10) {
      setEtapes([...etapes, { id: nextEtapeId, value: '' }])
      setEtapesPlaces([...etapesPlaces, null])
      setNextEtapeId(nextEtapeId + 1)
    }
  }

  const removeEtape = (id: number) => {
    if (etapes.length > 1) {
      const index = etapes.findIndex(etape => etape.id === id)
      if (index !== -1) {
        setEtapes(etapes.filter(etape => etape.id !== id))
        setEtapesPlaces(etapesPlaces.filter((_, i) => i !== index))
      }
    }
  }

  const updateEtape = (id: number, value: string, placeDetails?: google.maps.places.PlaceResult) => {
    const index = etapes.findIndex(etape => etape.id === id)
    if (index !== -1) {
      const newEtapes = [...etapes]
      newEtapes[index] = { ...newEtapes[index], value }
      setEtapes(newEtapes)
      
      if (placeDetails) {
        const newEtapesPlaces = [...etapesPlaces]
        newEtapesPlaces[index] = placeDetails
        setEtapesPlaces(newEtapesPlaces)
      }
    }
  }

  // Initialisation du token CSRF
  useEffect(() => {
    const token = CSRFProtection.setToken()
    setCsrfToken(token)
  }, [])

  // Gérer le changement de type de service
  const handleServiceTypeChange = (type: 'transfert' | 'mise-a-disposition') => {
    console.log('🔄 [PARENT] Changement de service:', type)
    setServiceType(type)
    setValue('serviceType', type)
    
    // Reset des données de trajet
    if (type === 'transfert') {
      setValue('duree', '')
    } else {
      setValue('arrivee', '')
      arriveeValueRef.current = ''
      setIsArriveeAutocompleted(false)
      setDestinationPlace(null)
    }
    
    setRouteInfo(null)
  }

  // Gérer le changement de type de véhicule
  const handleVehicleTypeChange = (type: 'berline' | 'van') => {
    setVehicleType(type)
    setValue('vehicleType', type)
  }

  // Soumission du formulaire
  const onSubmit = async (data: ReservationFormData) => {
    console.log('📝 [FORM] Début soumission')
    
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      // Vérification CSRF
      if (!CSRFProtection.validateToken(csrfToken)) {
        throw new Error('Token de sécurité invalide')
      }

      // Préparer les données
      const formData = {
        ...data,
        depart: departValueRef.current,
        arrivee: serviceType === 'transfert' ? arriveeValueRef.current : '',
        etapes: etapes.filter(e => e.value.trim()).map(e => e.value),
        estimatedPrice: priceBreakdown?.totalTTC || 0,
        csrfToken
      }

      console.log('📤 [FORM] Envoi des données:', formData)

      const response = await fetch('/api/reservation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi de la réservation')
      }

      console.log('✅ [FORM] Réservation envoyée avec succès')
      setSubmitSuccess(true)
      
      // Reset du formulaire
      reset()
      departValueRef.current = ''
      arriveeValueRef.current = ''
      setIsDepartAutocompleted(false)
      setIsArriveeAutocompleted(false)
      setOriginPlace(null)
      setDestinationPlace(null)
      setRouteInfo(null)
      setEtapes([{id: 0, value: ''}])
      setEtapesPlaces([null])
      setNextEtapeId(1)
      
      // Générer un nouveau token CSRF
      const newToken = CSRFProtection.setToken()
      setCsrfToken(newToken)
      
    } catch (error) {
      console.error('Erreur lors de la soumission:', error)
      setSubmitError(error instanceof Error ? error.message : 'Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Fonction pour reset complet du formulaire
  const resetCompleteForm = () => {
    console.log('🔄 [FORM] RESET COMPLET du formulaire')
    
    // Reset React Hook Form
    reset()
    
    // Reset des références d'adresses
    departValueRef.current = ''
    arriveeValueRef.current = ''
    
    // Reset des états d'autocomplete
    setIsDepartAutocompleted(false)
    setIsArriveeAutocompleted(false)
    
    // Reset des places Google Maps
    setOriginPlace(null)
    setDestinationPlace(null)
    setRouteInfo(null)
    
    // Reset des étapes
    setEtapes([{id: 0, value: ''}])
    setEtapesPlaces([null])
    setNextEtapeId(1)
    
    // Reset des états du formulaire
    setServiceType('transfert')
    setVehicleType('berline')
    setSubmitSuccess(false)
    setSubmitError(null)
    
    // Forcer le re-render des autocomplete
    setDepartKey(prev => prev + 1)
    setArriveeKey(prev => prev + 1)
    
    // Générer un nouveau token CSRF
    const newToken = CSRFProtection.setToken()
    setCsrfToken(newToken)
  }

  if (submitSuccess) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Réservation confirmée !</h2>
              <p className="text-gray-600">
                Votre demande de réservation a été envoyée avec succès. Nous vous contacterons dans les plus brefs délais pour confirmer les détails.
              </p>
            </div>
            <button
              onClick={resetCompleteForm}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Nouvelle réservation
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-gray-50" id="reservation">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Réserver votre transport</h2>
          <p className="text-lg text-gray-600">
            Remplissez le formulaire ci-dessous pour réserver votre transport en toute simplicité
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Section 1: Type de service */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Type de service</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleServiceTypeChange('transfert')}
                  className={`p-4 rounded-lg border-2 text-center transition-colors ${
                    serviceType === 'transfert'
                      ? 'border-blue-600 bg-blue-50 text-blue-900'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <div className="font-semibold">Transfert</div>
                  <div className="text-sm mt-1">Point A vers point B</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleServiceTypeChange('mise-a-disposition')}
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

            {/* Section 2: Type de véhicule */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Type de véhicule</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleVehicleTypeChange('berline')}
                  className={`p-4 rounded-lg border-2 text-center transition-colors ${
                    vehicleType === 'berline'
                      ? 'border-blue-600 bg-blue-50 text-blue-900'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <div className="font-semibold">Berline</div>
                  <div className="text-sm mt-1">1-3 passagers</div>
                  <div className="text-xs mt-1 text-gray-500">À partir de 50€</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleVehicleTypeChange('van')}
                  className={`p-4 rounded-lg border-2 text-center transition-colors ${
                    vehicleType === 'van'
                      ? 'border-blue-600 bg-blue-50 text-blue-900'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <div className="font-semibold">Voiture Van</div>
                  <div className="text-sm mt-1">1-8 passagers</div>
                  <div className="text-xs mt-1 text-gray-500">À partir de 80€</div>
                </button>
              </div>
            </div>

            {/* Section 3: Détails du trajet */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Détails du trajet</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="depart" className="block text-sm font-medium text-gray-700 mb-1">
                    Lieu de départ *
                  </label>
                  <DepartureAutocomplete
                    key={departKey}
                    value=""
                    onChange={(value, placeDetails, isAutocompleted) => {
                      departValueRef.current = value
                      setIsDepartAutocompleted(!!isAutocompleted)
                      if (placeDetails) {
                        setOriginPlace(placeDetails)
                      } else {
                        // Reset si pas d'autocomplétion
                        setOriginPlace(null)
                        setRouteInfo(null)
                      }
                    }}
                  />
                </div>

                {serviceType === 'transfert' ? (
                  <div>
                    <label htmlFor="arrivee" className="block text-sm font-medium text-gray-700 mb-1">
                      Lieu d'arrivée *
                    </label>
                    <ArrivalAutocomplete
                      key={arriveeKey}
                      value=""
                      onChange={(value, placeDetails, isAutocompleted) => {
                        arriveeValueRef.current = value
                        setIsArriveeAutocompleted(!!isAutocompleted)
                        if (placeDetails) {
                          setDestinationPlace(placeDetails)
                        } else {
                          // Reset si pas d'autocomplétion
                          setDestinationPlace(null)
                          setRouteInfo(null)
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div>
                    <label htmlFor="duree" className="block text-sm font-medium text-gray-700 mb-1">
                      Durée souhaitée *
                    </label>
                    <select
                      {...register('duree')}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="2">2 heures</option>
                      <option value="3">3 heures</option>
                      <option value="4">4 heures</option>
                      <option value="6">6 heures</option>
                      <option value="8">8 heures</option>
                      <option value="12">12 heures</option>
                    </select>
                  </div>
                )}

                {/* Étapes intermédiaires pour transfert */}
                {serviceType === 'transfert' && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Étapes intermédiaires (optionnel)
                      </label>
                      {etapes.length < 10 && (
                        <button
                          type="button"
                          onClick={addEtape}
                          className="text-blue-600 text-sm hover:text-blue-800"
                        >
                          + Ajouter une étape
                        </button>
                      )}
                    </div>
                    <div className="space-y-2">
                      {etapes.map((etape) => (
                        <div key={etape.id} className="flex gap-2">
                          <div className="flex-1">
                            <EtapeAutocomplete
                              value={etape.value}
                              onChange={(value, placeDetails) => updateEtape(etape.id, value, placeDetails)}
                              placeholder="Étape intermédiaire..."
                            />
                          </div>
                          {etapes.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeEtape(etape.id)}
                              className="px-3 py-2 text-red-600 hover:text-red-800"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Carte interactive */}
                {(isDepartAutocompleted || isArriveeAutocompleted) && (
                  <div className="mt-6">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Aperçu du trajet</h5>
                    <div className="h-64 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                      {/* Afficher la carte seulement si les deux adresses sont autocomplétées */}
                      {isDepartAutocompleted && isArriveeAutocompleted ? (
                        <div className="h-full animate-fade-in">
                          <InteractiveMap
                            origin={originPlace || undefined}
                            destination={destinationPlace || undefined}
                            waypoints={emptyWaypoints}
                            validWaypoints={emptyWaypoints}
                            onRouteCalculated={handleRouteCalculated}
                          />
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 text-gray-600 animate-fade-in">
                          <div className="text-center space-y-3">
                            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center animate-pulse">
                              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </div>
                            <h4 className="text-lg font-medium text-gray-700">Visualisation du trajet</h4>
                            <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
                              Renseignez vos adresses de départ et d'arrivée pour visualiser votre itinéraire sur la carte
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    {routeInfo && (
                      <div className="mt-2 text-sm text-gray-600 text-center">
                        Distance: {routeInfo.distance} • Durée: {routeInfo.duration}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Section 4: Date et heure */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Date et heure</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="dateReservation" className="block text-sm font-medium text-gray-700 mb-1">
                    Date de réservation *
                  </label>
                  <input
                    {...register('dateReservation')}
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.dateReservation && (
                    <p className="text-red-600 text-sm mt-1">{errors.dateReservation.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="heureReservation" className="block text-sm font-medium text-gray-700 mb-1">
                    Heure de réservation *
                  </label>
                  <input
                    {...register('heureReservation')}
                    type="time"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.heureReservation && (
                    <p className="text-red-600 text-sm mt-1">{errors.heureReservation.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 5: Informations personnelles */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Vos informations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="prenom" className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom *
                  </label>
                  <input
                    {...register('prenom')}
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.prenom && (
                    <p className="text-red-600 text-sm mt-1">{errors.prenom.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-1">
                    Nom *
                  </label>
                  <input
                    {...register('nom')}
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.nom && (
                    <p className="text-red-600 text-sm mt-1">{errors.nom.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="telephone" className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone *
                  </label>
                  <input
                    {...register('telephone')}
                    type="tel"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.telephone && (
                    <p className="text-red-600 text-sm mt-1">{errors.telephone.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.email && (
                    <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <label htmlFor="commentaires" className="block text-sm font-medium text-gray-700 mb-1">
                  Commentaires (optionnel)
                </label>
                <textarea
                  {...register('commentaires')}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Informations supplémentaires..."
                />
              </div>
            </div>

            {/* Section 6: Prix estimé */}
            {priceBreakdown && priceBreakdown.totalTTC > 0 && (
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Prix estimé</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Prix de base:</span>
                    <span>{priceBreakdown.basePrice.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between">
                    <span>TVA ({serviceType === 'transfert' ? '10' : '20'}%):</span>
                    <span>{priceBreakdown.tva.toFixed(2)}€</span>
                  </div>
                  {priceBreakdown.stripeFees > 0 && (
                    <div className="flex justify-between">
                      <span>Frais de paiement:</span>
                      <span>{priceBreakdown.stripeFees.toFixed(2)}€</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Total TTC:</span>
                    <span>{priceBreakdown.totalTTC.toFixed(2)}€</span>
                  </div>
                </div>
              </div>
            )}

            {/* Section 7: Méthode de paiement */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Méthode de paiement</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50">
                  <input
                    {...register('methodePaiement')}
                    type="radio"
                    value="immediate"
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <div className="font-semibold">Paiement immédiat</div>
                    <div className="text-sm text-gray-600">Paiement sécurisé par carte bancaire</div>
                  </div>
                </label>
                <label className="flex items-center p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50">
                  <input
                    {...register('methodePaiement')}
                    type="radio"
                    value="sur-place"
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <div className="font-semibold">Paiement sur place</div>
                    <div className="text-sm text-gray-600">Espèces ou carte bancaire</div>
                  </div>
                </label>
              </div>

              {/* Formulaire Stripe si paiement immédiat */}
              {methodePaiement === 'immediate' && priceBreakdown && priceBreakdown.totalTTC > 0 && (
                <div className="mt-6 p-6 border border-gray-200 rounded-lg bg-gray-50">
                  <h4 className="text-lg font-semibold mb-4">Paiement sécurisé</h4>
                  <div onClick={(e) => e.preventDefault()}>
                    <StripePaymentForm 
                      amount={Math.round((priceBreakdown?.totalTTC || 0) * 100)}
                      onSuccess={() => {
                        console.log('Paiement réussi')
                      }}
                      onError={(error) => {
                        console.error('Erreur de paiement:', error)
                        setSubmitError('Erreur lors du paiement: ' + error)
                      }}
                    />
                  </div>
                </div>
              )}

              {methodePaiement === 'immediate' && (!priceBreakdown || priceBreakdown.totalTTC === 0) && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-sm">
                    Veuillez remplir les informations de trajet pour voir le formulaire de paiement.
                  </p>
                </div>
              )}
            </div>

            {/* Section 8: Conditions */}
            <div>
              <label className="flex items-start space-x-3">
                <input
                  {...register('accepteConditions')}
                  type="checkbox"
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  J'accepte les{' '}
                  <a href="/cgv" className="text-blue-600 hover:underline" target="_blank">
                    conditions générales de vente
                  </a>{' '}
                  et la{' '}
                  <a href="/politique-confidentialite" className="text-blue-600 hover:underline" target="_blank">
                    politique de confidentialité
                  </a>
                  . *
                </span>
              </label>
              {errors.accepteConditions && (
                <p className="text-red-600 text-sm mt-1">{errors.accepteConditions.message}</p>
              )}
            </div>

            {/* Bouton de soumission */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Envoi en cours...' : 
                 methodePaiement === 'immediate' && priceBreakdown ? 
                   `Réserver et payer ${priceBreakdown.totalTTC.toFixed(2)}€` : 
                   'Envoyer la demande'}
              </button>
            </div>

            {/* Messages d'erreur */}
            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-700">{submitError}</p>
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  )
}