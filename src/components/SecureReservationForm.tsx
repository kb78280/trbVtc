'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import DepartureAutocomplete from './DepartureAutocomplete'
import ArrivalAutocomplete from './ArrivalAutocomplete'
import EtapeAutocomplete from './EtapeAutocomplete'
import InteractiveMap from './InteractiveMap'

const reservationSchema = z.object({
  serviceType: z.enum(['transfert', 'mise-a-disposition']),
  vehicleType: z.enum(['berline', 'van']),
  depart: z.string().optional(),
  arrivee: z.string().optional(),
  duree: z.string().optional(),
  dateReservation: z.string().min(1, 'La date est requise'),
  heureReservation: z.string().min(1, 'L\'heure est requise'),
  prenom: z.string().min(1, 'Le prénom est requis'),
  nom: z.string().min(1, 'Le nom est requis'),
  telephone: z.string().min(10, 'Le numéro de téléphone est requis'),
  email: z.string().email('L\'email n\'est pas valide'),
  nombrePassagers: z.string().min(1, 'Le nombre de passagers est requis'),
  nombreBagages: z.string().min(1, 'Le nombre de bagages est requis'),
  siegeEnfantQuantite: z.string().optional(),
  bouquetFleurs: z.boolean().optional(),
  assistanceAeroport: z.boolean().optional(),
  commentaires: z.string().optional(),
  methodePaiement: z.enum(['immediate', 'sur-place']),
  accepteConditions: z.boolean().refine(val => val === true, 'Vous devez accepter les conditions')
})

type ReservationFormData = z.infer<typeof reservationSchema>

export default function SecureReservationForm() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [serviceType, setServiceType] = useState<'transfert' | 'mise-a-disposition'>('transfert')
  const [vehicleType, setVehicleType] = useState<'berline' | 'van'>('berline')
  const [passengerCount, setPassengerCount] = useState<number>(1)
  const [baggageCount, setBaggageCount] = useState<number>(0)
  const [minDate, setMinDate] = useState<string>('2025-09-21')
  const [paymentMethod, setPaymentMethod] = useState<'immediate' | 'sur-place' | null>(null)

  // États pour Google Maps
  const [originPlace, setOriginPlace] = useState<google.maps.places.PlaceResult | null>(null)
  const [destinationPlace, setDestinationPlace] = useState<google.maps.places.PlaceResult | null>(null)
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null)
  
  // États pour les étapes
  const [etapes, setEtapes] = useState<Array<{id: number, value: string}>>([{id: 0, value: ''}])
  const [etapesPlaces, setEtapesPlaces] = useState<Array<google.maps.places.PlaceResult | null>>([null])
  const [nextEtapeId, setNextEtapeId] = useState(1)

  // Mettre à jour la date minimum côté client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setMinDate(new Date().toISOString().split('T')[0])
    }
  }, [])
  
  // Références pour les valeurs d'adresses
  const departValueRef = useRef('')
  const arriveeValueRef = useRef('')
  
  // États pour l'autocomplete
  const [isDepartAutocompleted, setIsDepartAutocompleted] = useState(false)
  const [isArriveeAutocompleted, setIsArriveeAutocompleted] = useState(false)
  
  // État pour contrôler l'interface (départ rempli ou non)
  const [hasDepartureAddress, setHasDepartureAddress] = useState(false)
  
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

  // Fonction pour gérer les transitions entre étapes
  const goToNextStep = useCallback(() => {
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentStep(prev => prev + 1)
      setIsTransitioning(false)
    }, 300)
  }, [])

  const goToPreviousStep = useCallback(() => {
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentStep(prev => prev - 1)
      setIsTransitioning(false)
    }, 300)
  }, [])

  // Validation de l'étape 1
  const validateStep1 = () => {
    // Vérifier les adresses via les PlaceResult (plus fiable que les refs)
    const hasValidAddresses = originPlace && destinationPlace
    
    // Vérifier date et heure
    const hasDateTime = watch('dateReservation') && watch('heureReservation')
    
    // Vérifier les sélections obligatoires
    const hasServiceType = serviceType
    const hasVehicleType = vehicleType
    
    console.log('🔍 [VALIDATION] État de la validation:', {
      hasValidAddresses: !!hasValidAddresses,
      originPlace: originPlace?.formatted_address,
      destinationPlace: destinationPlace?.formatted_address,
      hasDateTime,
      dateReservation: watch('dateReservation'),
      heureReservation: watch('heureReservation'),
      hasServiceType,
      hasVehicleType,
      serviceType,
      vehicleType
    })
    
    return hasValidAddresses && hasDateTime && hasServiceType && hasVehicleType
  }

  // Validation de l'étape 2
  const validateStep2 = () => {
    const prenom = watch('prenom')
    const nom = watch('nom')
    const telephone = watch('telephone')
    const email = watch('email')
    
    return prenom && nom && telephone && email
  }

  // Validation de l'étape 3
  const validateStep3 = () => {
    const accepteConditions = watch('accepteConditions')
    return paymentMethod && accepteConditions
  }

  // Gérer le changement de type de service
  const handleServiceTypeChange = (type: 'transfert' | 'mise-a-disposition') => {
    setServiceType(type)
    setValue('serviceType', type)
    
    if (type === 'transfert') {
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
    // Réinitialiser le nombre de passagers à 1 pour les deux types
    setPassengerCount(1)
  }

  // Soumission du formulaire
  const onSubmit = async (data: ReservationFormData) => {
    console.log('Données du formulaire:', data)
    // Ici vous pouvez traiter la soumission
    alert('Réservation envoyée !')
  }


    return (
    <section className="py-16 bg-gray-50" id="reservation">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Réserver votre transport</h2>
          <p className="text-lg text-gray-600">
            {currentStep === 1 && "Choisissez votre service et votre trajet"}
            {currentStep === 2 && "Vos informations et options"}
            {currentStep === 3 && "Finaliser votre réservation"}
          </p>
            </div>

        {/* Indicateur d'étapes */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === currentStep 
                    ? 'bg-blue-600 text-white' 
                    : step < currentStep 
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-300 text-gray-600'
                }`}>
                  {step < currentStep ? '✓' : step}
            </div>
                {step < 3 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    step < currentStep ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
            </div>
          </div>

        <div className={`bg-white rounded-lg shadow-md p-8 transition-opacity duration-300 ${
          isTransitioning ? 'opacity-0' : 'opacity-100'
        }`}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            
            {/* ÉTAPE 1: Sélection du service et trajet */}
            {currentStep === 1 && (
              <div className="space-y-6">
                {/* 1. La map */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Carte du trajet</h3>
                  <div className="h-64 rounded-lg border border-gray-300 overflow-hidden">
                    <InteractiveMap
                      origin={originPlace || undefined}
                      destination={destinationPlace || undefined}
                      validWaypoints={etapes.filter(e => e.value.trim()).map((_, index) => etapesPlaces[index]).filter((place): place is google.maps.places.PlaceResult => place !== null && place !== undefined)}
                      height="256px"
                      className="w-full h-full"
                      onRouteCalculated={(distance: string, duration: string) => {
                        console.log('Route calculée:', { distance, duration })
    setRouteInfo({ distance, duration })
                      }}
                    />
            </div>
          </div>

                {/* 2. Lieu de départ */}
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
                      
                      // Mettre à jour l'état pour contrôler l'interface
                      setHasDepartureAddress(value.trim().length > 0)
                      
                      if (placeDetails) {
                        setOriginPlace(placeDetails)
                        console.log('🗺️ Mise à jour de la carte avec le départ:', placeDetails.formatted_address)
                      }
                      
                      // Si on vide le départ, vider aussi l'arrivée
                      if (!value.trim()) {
                        arriveeValueRef.current = ''
                        setIsArriveeAutocompleted(false)
                        setDestinationPlace(null)
                        setArriveeKey(prev => prev + 1) // Forcer le re-render de l'arrivée
                      }
                    }}
                  />
                </div>

                {/* 3. Lieu d'arrivée */}
                <div>
                  <label htmlFor="arrivee" className="block text-sm font-medium text-gray-700 mb-1">
                    Lieu d'arrivée *
                  </label>
                  <div className={!hasDepartureAddress ? 'opacity-50 pointer-events-none' : ''}>
                  <ArrivalAutocomplete
                    key={arriveeKey}
                      value=""
                    onChange={(value, placeDetails, isAutocompleted) => {
                        // Ne pas permettre la saisie si le départ n'est pas rempli
                        if (!hasDepartureAddress) {
                          console.log('❌ Impossible de saisir l\'arrivée sans départ')
                          return
                        }
                        
                      arriveeValueRef.current = value
                      setIsArriveeAutocompleted(!!isAutocompleted)
                        if (placeDetails) {
                        setDestinationPlace(placeDetails)
                          console.log('🎯 Destination mise à jour:', placeDetails.formatted_address)
                      }
                    }}
                  />
            </div>
                </div>

                {/* 4. Type de service */}
                  <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    <span className="flex items-center gap-2">
                      🚗 Type de service
                    </span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => handleServiceTypeChange('transfert')}
                      className={`group relative p-6 rounded-xl border-2 text-left transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                        serviceType === 'transfert'
                          ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-900 shadow-md'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          serviceType === 'transfert' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600'
                        }`}>
                          🚕
                        </div>
                        <div>
                          <div className="font-semibold text-lg mb-1">Transfert</div>
                          <div className="text-sm opacity-75 mb-2">Point A vers point B</div>
                          <div className="text-xs font-medium opacity-60">
                            ✓ Trajet direct
                          </div>
                        </div>
                      </div>
                      {serviceType === 'transfert' && (
                        <div className="absolute top-2 right-2">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => handleServiceTypeChange('mise-a-disposition')}
                      className={`group relative p-6 rounded-xl border-2 text-left transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                        serviceType === 'mise-a-disposition'
                          ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100 text-purple-900 shadow-md'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-purple-300 hover:bg-purple-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          serviceType === 'mise-a-disposition' 
                            ? 'bg-purple-500 text-white' 
                            : 'bg-gray-100 text-gray-600 group-hover:bg-purple-100 group-hover:text-purple-600'
                        }`}>
                          🕐
                        </div>
                        <div>
                          <div className="font-semibold text-lg mb-1">Mise à disposition</div>
                          <div className="text-sm opacity-75 mb-2">Chauffeur à disposition</div>
                          <div className="text-xs font-medium opacity-60">
                            ✓ Flexibilité maximale
                          </div>
                        </div>
                      </div>
                      {serviceType === 'mise-a-disposition' && (
                        <div className="absolute top-2 right-2">
                          <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </button>
                  </div>
                </div>

                {/* 5. Date et heure côte à côte */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="dateReservation" className="block text-sm font-medium text-gray-700 mb-1">
                      Date de réservation *
                    </label>
                    <input
                      {...register('dateReservation')}
                      type="date"
                      min={minDate}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.dateReservation && (
                      <p className="mt-1 text-sm text-red-600">{errors.dateReservation.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="heureReservation" className="block text-sm font-medium text-gray-700 mb-1">
                      Heure de réservation *
                    </label>
                    <input
                      {...register('heureReservation')}
                      type="time"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.heureReservation && (
                      <p className="mt-1 text-sm text-red-600">{errors.heureReservation.message}</p>
                    )}
                  </div>
                </div>

                {/* 6. Passagers, Bagages et Durée côte à côte */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Nombre de passagers */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de passagers *
                    </label>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (passengerCount > 1) {
                            setPassengerCount(passengerCount - 1)
                          }
                        }}
                        disabled={passengerCount <= 1}
                        className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300 rounded border border-gray-300 text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      
                      <div className="flex-1 px-3 py-2 text-center border border-gray-300 rounded bg-gray-50 font-medium">
                        {passengerCount}
                    </div>
                      
                      <button
                        type="button"
                        onClick={() => {
                          const maxPassengers = vehicleType === 'berline' ? 3 : 8
                          if (passengerCount < maxPassengers) {
                            setPassengerCount(passengerCount + 1)
                          }
                        }}
                        disabled={passengerCount >= (vehicleType === 'berline' ? 3 : 8)}
                        className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300 rounded border border-gray-300 text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Max {vehicleType === 'berline' ? '3' : '8'}
                    </p>
                  </div>

                  {/* Nombre de bagages */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de bagages
                    </label>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (baggageCount > 0) {
                            setBaggageCount(baggageCount - 1)
                          }
                        }}
                        disabled={baggageCount <= 0}
                        className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300 rounded border border-gray-300 text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      
                      <div className="flex-1 px-3 py-2 text-center border border-gray-300 rounded bg-gray-50 font-medium">
                        {baggageCount}
                    </div>
                      
                      <button
                        type="button"
                        onClick={() => {
                          if (baggageCount < 10) {
                            setBaggageCount(baggageCount + 1)
                          }
                        }}
                        disabled={baggageCount >= 10}
                        className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300 rounded border border-gray-300 text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Max 10
                    </p>
                  </div>

                  {/* Durée (seulement pour mise à disposition) */}
                  {serviceType === 'mise-a-disposition' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Durée (heures) *
                      </label>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            const currentValue = parseInt(watch('duree') || '2')
                            if (currentValue > 2) {
                              setValue('duree', (currentValue - 1).toString())
                            }
                          }}
                          className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        </button>
                        
                        <input
                        {...register('duree')}
                          type="number"
                          min="2"
                          max="24"
                          step="1"
                          defaultValue="2"
                          className="flex-1 px-3 py-2 text-center border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                        />
                        
                        <button
                          type="button"
                          onClick={() => {
                            const currentValue = parseInt(watch('duree') || '2')
                            if (currentValue < 24) {
                              setValue('duree', (currentValue + 1).toString())
                            }
                          }}
                          className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        2-24h
                      </p>
                    </div>
                  )}
            </div>


                {/* 7. Type de véhicule */}
                <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    <span className="flex items-center gap-2">
                      🚙 Type de véhicule
                    </span>
                </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => handleVehicleTypeChange('berline')}
                      className={`group relative p-6 rounded-xl border-2 text-left transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                        vehicleType === 'berline'
                          ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-900 shadow-md'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-emerald-300 hover:bg-emerald-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          vehicleType === 'berline' 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-gray-100 text-gray-600 group-hover:bg-emerald-100 group-hover:text-emerald-600'
                        }`}>
                          🚗
                    </div>
                        <div>
                          <div className="font-semibold text-lg mb-1">Berline</div>
                          <div className="text-sm opacity-75 mb-2">1-3 passagers</div>
                          <div className="text-xs font-medium opacity-60">
                            ✓ À partir de 50€
                    </div>
                  </div>
                      </div>
                      {vehicleType === 'berline' && (
                        <div className="absolute top-2 right-2">
                          <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                </div>
              </div>
            )}
                    </button>
                    
                        <button
                          type="button"
                      onClick={() => handleVehicleTypeChange('van')}
                      className={`group relative p-6 rounded-xl border-2 text-left transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                        vehicleType === 'van'
                          ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-orange-100 text-orange-900 shadow-md'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-orange-300 hover:bg-orange-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          vehicleType === 'van' 
                            ? 'bg-orange-500 text-white' 
                            : 'bg-gray-100 text-gray-600 group-hover:bg-orange-100 group-hover:text-orange-600'
                        }`}>
                          🚐
                        </div>
                        <div>
                          <div className="font-semibold text-lg mb-1">Van</div>
                          <div className="text-sm opacity-75 mb-2">1-8 passagers</div>
                          <div className="text-xs font-medium opacity-60">
                            ✓ À partir de 80€
                          </div>
                        </div>
                      </div>
                      {vehicleType === 'van' && (
                        <div className="absolute top-2 right-2">
                          <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </button>
                    </div>
                </div>
                  

                  
                {/* Bouton Continuer */}
                <div className="flex justify-end pt-6">
                    <button
                      type="button"
                    onClick={goToNextStep}
                    disabled={!validateStep1()}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                      validateStep1()
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Continuer la réservation
                    </button>
                </div>
              </div>
            )}

            {/* ÉTAPE 2: Informations utilisateur et options */}
            {currentStep === 2 && (
              <div className="space-y-6">
            {/* Informations personnelles */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Vos informations</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="prenom" className="block text-sm font-medium text-gray-700 mb-1">
                      Prénom *
                    </label>
                    <input
                      {...register('prenom')}
                      type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Votre prénom"
                    />
                    {errors.prenom && (
                      <p className="mt-1 text-sm text-red-600">{errors.prenom.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-1">
                      Nom *
                    </label>
                    <input
                      {...register('nom')}
                      type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Votre nom"
                    />
                    {errors.nom && (
                      <p className="mt-1 text-sm text-red-600">{errors.nom.message}</p>
                    )}
                </div>

                <div>
                  <label htmlFor="telephone" className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone *
                  </label>
                  <input
                    {...register('telephone')}
                    type="tel"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Votre numéro de téléphone"
                  />
                  {errors.telephone && (
                    <p className="mt-1 text-sm text-red-600">{errors.telephone.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="votre@email.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>
              </div>
            </div>


                {/* Options supplémentaires */}
                      <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Options supplémentaires</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">Sièges enfants</div>
                        <div className="text-sm text-gray-600">€10.00 par siège</div>
                      </div>
                      <select
                        {...register('siegeEnfantQuantite')}
                        className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="0">0</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                      </select>
                </div>

                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">Bouquet de fleurs</div>
                        <div className="text-sm text-gray-600">€75.00</div>
                      </div>
                        <input
                          {...register('bouquetFleurs')}
                          type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                </div>

                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">Assistance Aéroport</div>
                        <div className="text-sm text-gray-600">€120.00</div>
                      </div>
                        <input
                          {...register('assistanceAeroport')}
                          type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                    </div>
                  </div>
                </div>

                {/* Commentaires */}
                <div>
                  <label htmlFor="commentaires" className="block text-sm font-medium text-gray-700 mb-1">
                    Commentaires (optionnel)
                  </label>
                  <textarea
                    {...register('commentaires')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Informations supplémentaires..."
                  />
              </div>

                {/* Boutons */}
                <div className="flex justify-between pt-6">
                  <button
                    type="button"
                    onClick={goToPreviousStep}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Retour
                  </button>
                  <button
                    type="button"
                    onClick={goToNextStep}
                    disabled={!validateStep2()}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                      validateStep2()
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Réserver
                  </button>
            </div>
              </div>
            )}

            {/* ÉTAPE 3: Choix de paiement */}
            {currentStep === 3 && (
              <div className="space-y-8">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">💳 Finaliser votre réservation</h3>
                  <p className="text-gray-600">Choisissez votre mode de paiement préféré</p>
                </div>

                {/* Options de paiement modernes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Payer maintenant */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('immediate')}
                    className={`group relative p-8 rounded-2xl border-2 text-left transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${
                      paymentMethod === 'immediate'
                        ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-900 shadow-lg'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl ${
                        paymentMethod === 'immediate' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600'
                      }`}>
                        💳
                      </div>
                      <div>
                        <div className="font-bold text-xl mb-2">Payer maintenant</div>
                        <div className="text-sm opacity-75 mb-3">Paiement sécurisé par carte</div>
                        <div className="flex items-center gap-2 text-xs font-medium opacity-60">
                          <span>🔒 Sécurisé par Stripe</span>
                        </div>
                      </div>
                    </div>
                    {paymentMethod === 'immediate' && (
                      <div className="absolute top-3 right-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </button>

                  {/* Payer plus tard */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('sur-place')}
                    className={`group relative p-8 rounded-2xl border-2 text-left transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${
                      paymentMethod === 'sur-place'
                        ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100 text-green-900 shadow-lg'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-green-300 hover:bg-green-50'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl ${
                        paymentMethod === 'sur-place' 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-100 text-gray-600 group-hover:bg-green-100 group-hover:text-green-600'
                      }`}>
                        🕐
                      </div>
                      <div>
                        <div className="font-bold text-xl mb-2">Payer plus tard</div>
                        <div className="text-sm opacity-75 mb-3">Espèces ou carte sur place</div>
                        <div className="flex items-center gap-2 text-xs font-medium opacity-60">
                          <span>💰 Flexible et pratique</span>
                        </div>
                      </div>
                    </div>
                    {paymentMethod === 'sur-place' && (
                      <div className="absolute top-3 right-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </button>
                </div>

                {/* Formulaire Stripe - Affiché seulement si "Payer maintenant" */}
                {paymentMethod === 'immediate' && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200">
                    <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                      🔒 Paiement sécurisé
                    </h4>
                    <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-sm">
                      <div className="text-center text-blue-600 font-medium mb-4">
                        💳 Formulaire de carte bancaire Stripe
                      </div>
                      <div className="text-sm text-gray-600 text-center">
                        Le composant Stripe sera intégré ici<br/>
                        <span className="text-xs opacity-75">Paiement 100% sécurisé et crypté</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Conditions */}
                <div className="border-t pt-6">
                  <label className="flex items-start space-x-3">
                    <input
                      {...register('accepteConditions')}
                      type="checkbox"
                      className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      J'accepte les <a href="#" className="text-blue-600 hover:underline">conditions générales</a> et 
                      la <a href="#" className="text-blue-600 hover:underline">politique de confidentialité</a>
                      </span>
                  </label>
                  {errors.accepteConditions && (
                    <p className="mt-1 text-sm text-red-600">{errors.accepteConditions.message}</p>
                  )}
                </div>
                
                {/* Boutons */}
                <div className="flex justify-between pt-6">
                  <button
                    type="button"
                    onClick={goToPreviousStep}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Retour
                  </button>
            <button
              type="submit"
              disabled={!validateStep3()}
              className={`px-8 py-3 rounded-lg font-medium transition-all duration-300 ${
                validateStep3()
                  ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transform hover:scale-105'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {paymentMethod === 'immediate' ? '💳 Payer et confirmer' : '✅ Confirmer la réservation'}
            </button>
            </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  )
}