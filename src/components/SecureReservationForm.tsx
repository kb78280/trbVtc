'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast, { Toaster } from 'react-hot-toast'
import DepartureAutocomplete from './DepartureAutocomplete'
import ArrivalAutocomplete from './ArrivalAutocomplete'
import InteractiveMap from './InteractiveMap'
import StripePaymentForm from './StripePaymentForm'

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
  const [minDate, setMinDate] = useState<string>('')
  const [isClient, setIsClient] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'immediate' | 'sur-place' | null>(null)
  const [paymentAmount, setPaymentAmount] = useState<number>(5000) // 50€ par défaut en centimes
  const [paymentError, setPaymentError] = useState<string>('')
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false)
  const [isSubmittingReservation, setIsSubmittingReservation] = useState<boolean>(false)

  // États pour Google Maps
  const [originPlace, setOriginPlace] = useState<google.maps.places.PlaceResult | null>(null)
  const [destinationPlace, setDestinationPlace] = useState<google.maps.places.PlaceResult | null>(null)

  // Initialisation côté client pour éviter l'hydratation mismatch
  useEffect(() => {
    setIsClient(true)
    // Utiliser une date fixe pour éviter les problèmes de fuseau horaire avec VPN
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    setMinDate(`${year}-${month}-${day}`)
  }, [])
  
  // Références pour les valeurs d'adresses
  const departValueRef = useRef('')
  const arriveeValueRef = useRef('')
  
  // État pour contrôler l'interface (départ rempli ou non)
  const [hasDepartureAddress, setHasDepartureAddress] = useState(false)
  
  // Clés pour forcer le re-render des autocomplete
  const [departKey] = useState(0)
  const [arriveeKey, setArriveeKey] = useState(0)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<ReservationFormData>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      serviceType: 'transfert',
      vehicleType: 'berline',
      methodePaiement: 'immediate'
    }
  })

  const scrollToFormSection = () => {
    const formElement = document.getElementById('reservation-form')
    if (formElement) {
      const offset = window.innerWidth < 768 ? 80 : 100
      const elementPosition = formElement.offsetTop - offset
      
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      })
    }
  }
  const goToNextStep = useCallback(() => {
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentStep(prev => prev + 1)
      setIsTransitioning(false)
      setTimeout(scrollToFormSection, 100)
    }, 300)
  }, [])

  const goToPreviousStep = useCallback(() => {
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentStep(prev => prev - 1)
      setIsTransitioning(false)
      setTimeout(scrollToFormSection, 100)
    }, 300)
  }, [])

  const validateStep1 = () => {
    const hasValidAddresses = originPlace && destinationPlace
    const hasDateTime = watch('dateReservation') && watch('heureReservation')
    const hasServiceType = serviceType
    const hasVehicleType = vehicleType
    
    return hasValidAddresses && hasDateTime && hasServiceType && hasVehicleType
  }

  const validateStep2 = () => {
    const prenom = watch('prenom')
    const nom = watch('nom')
    const telephone = watch('telephone')
    const email = watch('email')
    
    return prenom && nom && telephone && email
  }

  const validateStep3 = () => {
    const accepteConditions = watch('accepteConditions')
    const isValid = paymentMethod && accepteConditions
    
    // Debug pour identifier le problème
    console.log('🔍 Debug validateStep3:', {
      paymentMethod,
      accepteConditions,
      isValid
    })
    
    return isValid
  }

  const handleServiceTypeChange = (type: 'transfert' | 'mise-a-disposition') => {
    setServiceType(type)
    setValue('serviceType', type)
    
    if (type === 'transfert') {
      setValue('arrivee', '')
      arriveeValueRef.current = ''
      setDestinationPlace(null)
    }
  }

  // Gérer le changement de type de véhicule
  const handleVehicleTypeChange = (type: 'berline' | 'van') => {
    setVehicleType(type)
    setValue('vehicleType', type)
    // Réinitialiser le nombre de passagers à 1 pour les deux types
    setPassengerCount(1)
    // Mettre à jour le montant selon le type de véhicule
    const baseAmount = type === 'berline' ? 5000 : 8000 // 50€ ou 80€ en centimes
    setPaymentAmount(baseAmount)
  }

  // Gestion du succès de paiement Stripe
  const handlePaymentSuccess = () => {
    setPaymentSuccess(true)
    setPaymentError('')
    console.log('✅ Paiement réussi !')
    // Ici vous pouvez traiter la réservation payée
    alert('🎉 Paiement réussi ! Votre réservation est confirmée.')
  }

  // Gestion des erreurs de paiement Stripe
  const handlePaymentError = (error: string) => {
    setPaymentError(error)
    setPaymentSuccess(false)
    console.error('❌ Erreur de paiement:', error)
  }

  // Fonction pour soumettre la réservation à la base de données
  const submitReservationToDatabase = async (data: ReservationFormData) => {
    try {
      // Préparer les données pour l'API
      const reservationData = {
        serviceType: data.serviceType,
        vehicleType: data.vehicleType,
        depart: departValueRef.current,
        arrivee: arriveeValueRef.current,
        originPlace: originPlace,
        destinationPlace: destinationPlace,
        duree: data.duree,
        dateReservation: data.dateReservation,
        heureReservation: data.heureReservation,
        prenom: data.prenom,
        nom: data.nom,
        telephone: data.telephone,
        email: data.email,
        nombrePassagers: passengerCount.toString(),
        nombreBagages: baggageCount.toString(),
        siegeEnfantQuantite: data.siegeEnfantQuantite || '0',
        bouquetFleurs: data.bouquetFleurs || false,
        assistanceAeroport: data.assistanceAeroport || false,
        commentaires: data.commentaires || '',
        methodePaiement: data.methodePaiement,
        accepteConditions: data.accepteConditions,
        estimatedPrice: paymentAmount / 100 // Convertir centimes en euros
      }

      console.log('📤 Envoi des données à l\'API:', reservationData)

      // URL API selon l'environnement
      const apiUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3000/api/test-reservation' // API locale pour dev
        : 'https://vtc-transport-conciergerie.fr/api-php/reservation.php'; // API OVH pour prod
        
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reservationData)
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.message || result.error || 'Erreur lors de la réservation')
      }

      return result
    } catch (error) {
      console.error('❌ Erreur lors de la soumission:', error)
      throw error
    }
  }

  // Soumission du formulaire
  const onSubmit = async (data: ReservationFormData) => {
    console.log('Données du formulaire:', data)
    
    if (paymentMethod === 'sur-place') {
      // Paiement plus tard - confirmer avec appel à la base de données
      setIsSubmittingReservation(true)
      
      // Afficher un toast de chargement
      const loadingToast = toast.loading('⏳ Confirmation de votre réservation en cours...')
      
      try {
        const result = await submitReservationToDatabase(data)
        
        // Succès - fermer le toast de chargement et afficher le succès
        toast.dismiss(loadingToast)
        toast.success(
          '🎉 Réservation confirmée !\n✉️ Vous allez recevoir un email de confirmation.',
          {
            duration: 6000,
            style: {
              background: '#10B981',
              color: 'white',
              padding: '16px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
              maxWidth: '400px'
            },
            iconTheme: {
              primary: 'white',
              secondary: '#10B981'
            }
          }
        )
        
        console.log('✅ Réservation créée avec succès:', result)
        
        // Optionnel : réinitialiser le formulaire ou rediriger
        // setTimeout(() => {
        //   window.location.reload()
        // }, 3000)
        
      } catch (error) {
        // Erreur - fermer le toast de chargement et afficher l'erreur
        toast.dismiss(loadingToast)
        toast.error(
          '❌ Erreur lors de la confirmation de la réservation.\nVeuillez réessayer ou nous contacter.',
          {
            duration: 8000,
            style: {
              background: '#EF4444',
              color: 'white',
              padding: '16px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
              maxWidth: '400px'
            },
            iconTheme: {
              primary: 'white',
              secondary: '#EF4444'
            }
          }
        )
        
        console.error('❌ Erreur lors de la réservation:', error)
      } finally {
        setIsSubmittingReservation(false)
      }
    } else if (paymentMethod === 'immediate') {
      // Paiement immédiat - le paiement sera géré par Stripe
      console.log('💳 Paiement immédiat - géré par Stripe')
    }
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

        <div className={`bg-white rounded-lg shadow-md p-4 sm:p-8 transition-opacity duration-300 ${
          isTransitioning ? 'opacity-0' : 'opacity-100'
        }`}>
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                Étape {currentStep} sur 3
              </h2>
              <div className="text-sm text-gray-500">
                {currentStep === 1 && "📍 Trajet"}
                {currentStep === 2 && "👤 Informations"}
                {currentStep === 3 && "💳 Paiement"}
              </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(currentStep / 3) * 100}%` }}
              ></div>
            </div>
          </div>

          <form 
            id="reservation-form" 
            onSubmit={handleSubmit(onSubmit)} 
            className="space-y-6 sm:space-y-8"
          >
            
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Carte du trajet</h3>
                  <div className="h-64 rounded-lg border border-gray-300 overflow-hidden">
                    <InteractiveMap
                      origin={originPlace || undefined}
                      destination={destinationPlace || undefined}
                      height="256px"
                      className="w-full h-full"
                      onRouteCalculated={(distance: string, duration: string) => {
                        console.log('Route calculée:', { distance, duration })
                      }}
                    />
            </div>
          </div>

                <div>
                  <label htmlFor="depart" className="block text-sm font-medium text-gray-700 mb-1">
                    Lieu de départ *
                  </label>
                  <DepartureAutocomplete
                    key={departKey}
                    value=""
                    onChange={(value, placeDetails) => {
                      departValueRef.current = value
                      
                      // Mettre à jour l'état pour contrôler l'interface
                      setHasDepartureAddress(value.trim().length > 0)
                      
                      if (placeDetails) {
                        setOriginPlace(placeDetails)
                        console.log('🗺️ Mise à jour de la carte avec le départ:', placeDetails.formatted_address)
                      }
                      
                      // Si on vide le départ, vider aussi l'arrivée
                      if (!value.trim()) {
                        arriveeValueRef.current = ''
                        setDestinationPlace(null)
                        setArriveeKey(prev => prev + 1) // Forcer le re-render de l'arrivée
                      }
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="arrivee" className="block text-sm font-medium text-gray-700 mb-1">
                    Lieu d'arrivée *
                  </label>
                  <div className={!hasDepartureAddress ? 'opacity-50 pointer-events-none' : ''}>
                  <ArrivalAutocomplete
                    key={arriveeKey}
                      value=""
                    onChange={(value, placeDetails) => {
                        // Ne pas permettre la saisie si le départ n'est pas rempli
                        if (!hasDepartureAddress) {
                          console.log('❌ Impossible de saisir l\'arrivée sans départ')
                          return
                        }
                        
                      arriveeValueRef.current = value
                        if (placeDetails) {
                        setDestinationPlace(placeDetails)
                          console.log('🎯 Destination mise à jour:', placeDetails.formatted_address)
                      }
                    }}
                  />
            </div>
                </div>

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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="dateReservation" className="block text-sm font-medium text-gray-700 mb-1">
                      Date de réservation *
                    </label>
                    <input
                      {...register('dateReservation')}
                      type="date"
                      min={isClient ? minDate : undefined}
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  

                  
                <div className="flex justify-center sm:justify-end pt-6">
                  <button
                    type="button"
                    onClick={goToNextStep}
                    disabled={!validateStep1()}
                    className={`w-full sm:w-auto px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                      validateStep1()
                        ? 'bg-blue-600 text-white hover:bg-blue-700 transform hover:scale-105 shadow-lg hover:shadow-xl'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    📍 Continuer la réservation
                  </button>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
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

                <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6">
                  <button
                    type="button"
                    onClick={goToPreviousStep}
                    className="w-full sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all duration-300 order-2 sm:order-1"
                  >
                    ← Retour
                  </button>
                  <button
                    type="button"
                    onClick={goToNextStep}
                    disabled={!validateStep2()}
                    className={`w-full sm:w-auto px-6 py-3 rounded-lg font-medium transition-all duration-300 order-1 sm:order-2 ${
                      validateStep2()
                        ? 'bg-blue-600 text-white hover:bg-blue-700 transform hover:scale-105 shadow-lg hover:shadow-xl'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    👤 Continuer vers le paiement
                  </button>
            </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-8">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">💳 Finaliser votre réservation</h3>
                  <p className="text-gray-600">Choisissez votre mode de paiement préféré</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                {paymentMethod === 'immediate' && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200">
                    <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                      🔒 Paiement sécurisé
                    </h4>
                    
                    <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-900 mb-1">
                          {(paymentAmount / 100).toFixed(2)} €
                        </div>
                        <div className="text-sm text-gray-600">
                          Montant à payer
                        </div>
                      </div>
                    </div>

                    {paymentError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 text-red-800">
                          <span>❌</span>
                          <span className="font-medium">Erreur de paiement</span>
                        </div>
                        <div className="text-red-600 text-sm mt-1">{paymentError}</div>
                      </div>
                    )}

                    {paymentSuccess && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 text-green-800">
                          <span>✅</span>
                          <span className="font-medium">Paiement réussi !</span>
                        </div>
                        <div className="text-green-600 text-sm mt-1">
                          Votre réservation a été confirmée.
                        </div>
                      </div>
                    )}

                    {!paymentSuccess && (
                      <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-sm">
                        <StripePaymentForm
                          amount={paymentAmount}
                          onSuccess={handlePaymentSuccess}
                          onError={handlePaymentError}
                        />
                      </div>
                    )}
                  </div>
                )}

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
                
                <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6">
                  <button
                    type="button"
                    onClick={goToPreviousStep}
                    className="w-full sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all duration-300 order-2 sm:order-1"
                  >
                    ← Retour
                  </button>
            <button
              type={paymentMethod === 'sur-place' ? 'submit' : 'button'}
              disabled={!validateStep3() || (paymentMethod === 'immediate' && !paymentSuccess) || isSubmittingReservation}
              className={`w-full sm:w-auto px-8 py-3 rounded-lg font-medium transition-all duration-300 order-1 sm:order-2 ${
                validateStep3() && (paymentMethod === 'sur-place' || paymentSuccess) && !isSubmittingReservation
                  ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transform hover:scale-105'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isSubmittingReservation ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Confirmation en cours...
                </span>
              ) : (
                paymentMethod === 'immediate' 
                  ? (paymentSuccess ? '✅ Réservation confirmée' : '💳 Effectuez le paiement ci-dessus')
                  : '✅ Confirmer la réservation'
              )}
            </button>
            </div>
              </div>
            )}
          </form>
        </div>
      </div>
      
      {/* Toaster pour les notifications */}
      <Toaster 
        position="top-right"
        reverseOrder={false}
        gutter={8}
        containerStyle={{
          top: 20,
          right: 20
        }}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500'
          }
        }}
      />
    </section>
  )
}