'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import DepartureAutocomplete from './DepartureAutocomplete'
import ArrivalAutocomplete from './ArrivalAutocomplete'
import InteractiveMap from './InteractiveMap'
import StripePaymentForm from './StripePaymentForm'
import { LocationResult } from '@/types/location'
import { useVehicles } from '@/hooks/useVehicles';

// Schéma de validation (inchangé)
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
  const [paymentAmount, setPaymentAmount] = useState<number>(0)
  const [paymentError, setPaymentError] = useState<string>('')
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false)

  // NOUVEAU : États avec LocationResult (Open Source) au lieu de Google Maps
  const [originPlace, setOriginPlace] = useState<LocationResult | null>(null)
  const [destinationPlace, setDestinationPlace] = useState<LocationResult | null>(null)
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null)

  const isDepartureValid = !!originPlace && !!originPlace.lat;
  
  // États d'interface
  const [isDepartAutocompleted, setIsDepartAutocompleted] = useState(false)
  const [isArriveeAutocompleted, setIsArriveeAutocompleted] = useState(false)
  const [hasDepartureAddress, setHasDepartureAddress] = useState(false)
  
  // Clés pour forcer le rafraîchissement
  const [departKey, setDepartKey] = useState(0)
  const [arriveeKey, setArriveeKey] = useState(0)
  const { vehiclesByType, loading: loadingVehicles } = useVehicles();

  const parseDistance = (distanceStr: string): number => {
    if (!distanceStr) return 0;
    // Enlève " km" et remplace la virgule par un point si nécessaire
    const cleanStr = distanceStr.toLowerCase().replace(' km', '').replace(',', '.');
    return parseFloat(cleanStr) || 0;
  };
  // Références pour les valeurs
  const departValueRef = useRef('')
  const arriveeValueRef = useRef('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setMinDate(new Date().toISOString().split('T')[0])
    }
  }, [])

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

  // Effet pour recalculer le prix automatiquement avec la TVA différenciée
  useEffect(() => {
    const calculatePrice = () => {
      const currentVehicles = vehiclesByType[vehicleType === 'berline' ? 'confort' : 'van'];
      const referenceVehicle = currentVehicles && currentVehicles.length > 0 ? currentVehicles[0] : null;

      if (!referenceVehicle) return;

      let priceInCents = 0;

      if (serviceType === 'transfert') {
        // --- LOGIQUE TRANSFERT (TVA 10%) ---
        const TAUX_TVA_TRANSFERT = 1.10; 

        if (routeInfo && routeInfo.distance) {
          const distanceKm = parseDistance(routeInfo.distance);
          const ratePerKm = referenceVehicle.price_info.rate_per_km;
          
          // Formule : (Distance * TarifKM * 1.10) * 100
          let price = distanceKm * ratePerKm * TAUX_TVA_TRANSFERT * 100;
          
          priceInCents = price;
        } else {
          priceInCents = 0; 
        }

      } else {
        // --- LOGIQUE MISE À DISPOSITION (TVA 20%) ---
        const TAUX_TVA_MAD = 1.20;

        const dureeHeures = parseInt(watch('duree') || '0');
        const tarifHoraire = referenceVehicle.price_info.base_hourly;
        
        if (dureeHeures > 0) {
           // Formule : (Heures * TarifHoraire * 1.20) * 100
           priceInCents = dureeHeures * tarifHoraire * TAUX_TVA_MAD * 100;
        }
      }

      // Mise à jour de l'état (arrondi à l'entier le plus proche)
      setPaymentAmount(Math.round(priceInCents));
    };

    calculatePrice();
  }, [
    serviceType, 
    vehicleType, 
    routeInfo, 
    vehiclesByType, 
    watch('duree')
  ]);

  const scrollToFormSection = () => {
    const formElement = document.getElementById('reservation-form')
    if (formElement) {
      const offset = window.innerWidth < 768 ? 80 : 100
      const elementPosition = formElement.offsetTop - offset
      window.scrollTo({ top: elementPosition, behavior: 'smooth' })
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
    // Validation stricte : il faut les objets complets (lat/lng), pas juste du texte
    const isDepartValid = !!originPlace;
    const isArriveeValid = serviceType === 'mise-a-disposition' ? true : !!destinationPlace;
    
    const hasDateTime = watch('dateReservation') && watch('heureReservation');
    
    return isDepartValid && isArriveeValid && hasDateTime;
  }

  const handleRouteCalculated = useCallback((distance: string, duration: string) => {
    // Petite sécurité supplémentaire : on ne met à jour que si les valeurs changent vraiment
    setRouteInfo(prev => {
      if (prev && prev.distance === distance && prev.duration === duration) {
        return prev;
      }
      console.log('Route calculée (OSRM):', { distance, duration });
      return { distance, duration };
    });
  }, []);

  const validateStep2 = () => {
    const prenom = watch('prenom')
    const nom = watch('nom')
    const telephone = watch('telephone')
    const email = watch('email')
    return !!(prenom && nom && telephone && email)
  }

  const validateStep3 = () => {
    const accepteConditions = watch('accepteConditions')
    return !!(paymentMethod && accepteConditions)
  }

  const handleServiceTypeChange = (type: 'transfert' | 'mise-a-disposition') => {
    setServiceType(type)
    setValue('serviceType', type)
    setOriginPlace(null)
    setDestinationPlace(null)
    setRouteInfo(null)
    if (departValueRef.current) departValueRef.current = ''
    if (arriveeValueRef.current) arriveeValueRef.current = ''
    setValue('depart', '')
    setValue('arrivee', '')

    if (type === 'mise-a-disposition') {
      setValue('duree', '1') 
  }


    setVehicleType('berline')
    setValue('vehicleType', 'berline')
    setPassengerCount(1)
    setBaggageCount(0)
  }

  const handleVehicleTypeChange = (type: 'berline' | 'van') => {
    setVehicleType(type)
    setValue('vehicleType', type)
    setPassengerCount(1)
  }

  const handlePaymentSuccess = () => {
    setPaymentSuccess(true)
    setPaymentError('')
    alert('🎉 Paiement réussi ! Votre réservation est confirmée.')
  }

  const handlePaymentError = (error: string) => {
    setPaymentError(error)
    setPaymentSuccess(false)
  }

  const onSubmit = async (data: ReservationFormData) => {
    try {
      // 1. Préparation des données pour l'API
      const payload = {
        ...data,
        // On envoie le prix calculé (converti de centimes en euros pour l'API PHP)
        estimatedPrice: paymentAmount / 100, 
        // On envoie la distance textuelle pour que le PHP puisse extraire les km si besoin
        distance: routeInfo?.distance || null,
        // On envoie la distance brute en km si possible
        distanceKm: routeInfo?.distance ? parseDistance(routeInfo.distance) : null,
        // On s'assure que la durée est bien envoyée pour les mises à disposition
        duree: serviceType === 'mise-a-disposition' ? data.duree : null
      };

      console.log('Envoi de la réservation...', payload);

      // 2. Appel à l'API PHP
      const response = await fetch('https://vtc-transport-conciergerie.fr/api-php/reservation.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || "Une erreur est survenue lors de la réservation");
      }

      // 3. Gestion du succès selon le mode de paiement
      if (paymentMethod === 'sur-place') {
        alert('✅ Réservation confirmée avec succès ! Vous recevrez un email de confirmation.');
        // Optionnel : Rediriger vers une page de succès ou reset le formulaire
        // window.location.href = "/succes"; 
      } else if (paymentMethod === 'immediate') {
        // Pour le paiement immédiat, le paiement a déjà été fait via le composant StripePaymentForm
        // L'API a enregistré la réservation, tout est bon.
        console.log('💳 Réservation payée et enregistrée');
        alert('✅ Paiement validé et réservation confirmée ! Vous recevrez un email de confirmation.');
      }

    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      alert('❌ Erreur : ' + (error instanceof Error ? error.message : "Impossible d'enregistrer la réservation"));
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
                  step === currentStep ? 'bg-blue-600 text-white' : step < currentStep ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  {step < currentStep ? '✓' : step}
                </div>
                {step < 3 && (
                  <div className={`w-12 h-0.5 mx-2 ${step < currentStep ? 'bg-green-500' : 'bg-gray-300'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className={`bg-white rounded-lg shadow-md p-4 sm:p-8 transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
          
          <form id="reservation-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8" suppressHydrationWarning={true}>
            
            {currentStep === 1 && (
              <div className="space-y-6">
                
                {/* CARTE OPEN SOURCE */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Carte du trajet</h3>
                  <div className="h-64 rounded-lg border border-gray-300 overflow-hidden relative z-0">
                    <InteractiveMap
                      origin={originPlace}
                      destination={destinationPlace}
                      height="256px"
                      onRouteCalculated={handleRouteCalculated}
                    />
                  </div>
                  {routeInfo && (
                    <div className="mt-2 flex justify-center gap-4 text-sm text-gray-600 bg-blue-50 p-2 rounded">
                      <span className="font-semibold">🏁 Distance : {routeInfo.distance}</span>
                      <span className="font-semibold">⏱️ Durée : {routeInfo.duration}</span>
                    </div>
                  )}
                </div>

                {/* DÉPART */}
                <div>
                  <label htmlFor="depart" className="block text-sm font-medium text-gray-900 mb-1 font-bold">
                    Lieu de départ *
                  </label>
                  <DepartureAutocomplete
                        value={departValueRef.current}
                        onChange={(value, location) => {
                          departValueRef.current = value
                          setValue('depart', value)
                          
                          // Si location est undefined (l'utilisateur tape), originPlace devient null
                          setOriginPlace(location || null) 
                          
                          // Si on invalide le départ, on reset l'arrivée par sécurité
                          if (!location) {
                            setRouteInfo(null) // Efface "Distance: ... Durée: ..."
                            // On NE touche PAS à destinationPlace ni à arriveeValueRef
                          }
                        }}
                      />
                </div>

                {/* ARRIVÉE (Pour Transfert) */}
                <div className={serviceType === 'mise-a-disposition' ? 'hidden' : ''}>
                  <label htmlFor="arrivee" className="block text-sm font-medium text-gray-900 mb-1 font-bold">
                    Lieu d'arrivée *
                  </label>
                  <div className={!originPlace ? 'opacity-50 pointer-events-none' : ''}>
                    <ArrivalAutocomplete
                      value={arriveeValueRef.current}
                      disabled={!isDepartureValid}
                      placeholder={!isDepartureValid ? "Veuillez d'abord valider le départ..." : "Destination (ex: Gare de Lyon...)"}
                      onChange={(value, location) => {
                        arriveeValueRef.current = value
                        setValue('arrivee', value)
                        setDestinationPlace(location || null)
                        if (!location) {
                          setRouteInfo(null)
                        }
                      }}
                    />
                  </div>
                  {!isDepartureValid && (
                    <p className="text-xs text-orange-600 mt-1 flex items-center">
                      🔒 Validez une adresse de départ dans la liste pour débloquer la destination.
                    </p>
                  )}
                </div>

                {/* DURÉE (Pour Mise à disposition uniquement) */}
                {/* DURÉE (Uniquement pour Mise à disposition) */}
                {serviceType === 'mise-a-disposition' && (
                  <div>
                    <label htmlFor="duree" className="block text-sm font-medium text-gray-900 mb-1 font-bold">
                      Durée souhaitée *
                    </label>
                    <select
                      {...register('duree')}
                      className="w-full p-3 border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      {[...Array(12)].map((_, i) => (
                        <option key={i} value={i + 1}>
                          {i + 1} heure{i > 0 ? 's' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Message d'aide si départ non valide (commun aux deux) */}
                {!originPlace && (
                  <p className="text-xs text-blue-600 mt-1 flex items-center">
                    <span className="mr-1">ℹ️</span> 
                    Veuillez valider une adresse de départ pour continuer.
                  </p>
                )}

                {/* TYPE DE SERVICE */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    <span className="flex items-center gap-2">🚗 Type de service</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => handleServiceTypeChange('transfert')}
                      className={`group relative p-6 rounded-xl border-2 text-left transition-all duration-300 ${
                        serviceType === 'transfert'
                          ? 'border-blue-500 bg-blue-50 text-blue-900 shadow-md'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
                      }`}
                    >
                      <div className="font-semibold text-lg mb-1">Transfert</div>
                      <div className="text-sm opacity-75">Point A vers point B</div>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => handleServiceTypeChange('mise-a-disposition')}
                      className={`group relative p-6 rounded-xl border-2 text-left transition-all duration-300 ${
                        serviceType === 'mise-a-disposition'
                          ? 'border-purple-500 bg-purple-50 text-purple-900 shadow-md'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-purple-300'
                      }`}
                    >
                      <div className="font-semibold text-lg mb-1">Mise à disposition</div>
                      <div className="text-sm opacity-75">Chauffeur à l'heure</div>
                    </button>
                  </div>
                </div>

                {/* DATE & HEURE */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1 font-bold">Date *</label>
                    <input {...register('dateReservation')} type="date" min={minDate} className="w-full p-3 border rounded-md "  suppressHydrationWarning={true}/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1 font-bold">Heure *</label>
                    <input {...register('heureReservation')} type="time" className="w-full p-3 border border-gray-300 rounded-md text-gray-900 font-medium bg-white focus:ring-2 focus:ring-blue-600" suppressHydrationWarning={true}/>
                  </div>
                </div>

                {/* PASSAGERS & VÉHICULE */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {/* Sélecteur Véhicule simplifié */}
                   <div className="flex gap-2">
                      <button type="button" onClick={() => handleVehicleTypeChange('berline')} className={`flex-1 p-3 border rounded transition-colors ${vehicleType === 'berline' ? 'bg-emerald-100 border-emerald-500 text-emerald-900' : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'}`}>Berline</button>
                      <button type="button" onClick={() => handleVehicleTypeChange('van')} className={`flex-1 p-3 border rounded font-bold transition-colors ${vehicleType === 'van' ? 'bg-orange-100 border-orange-500 text-orange-900' : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'}`}>Van</button>
                   </div>
                   
                   {/* Compteur Passagers */}
                   <div className="flex items-center border border-gray-300 rounded p-2 bg-white">
                      <span className="flex-1 text-sm font-semibold text-gray-900">Passagers</span>
                      <button type="button" onClick={() => setPassengerCount(Math.max(1, passengerCount - 1))} className="w-8 h-8 flex items-center justify-center bg-gray-200 text-gray-900 font-bold rounded hover:bg-gray-300">-</button>
                      <span className="mx-4 font-bold text-lg text-gray-900">{passengerCount}</span>
                      <button type="button" onClick={() => setPassengerCount(Math.min(vehicleType === 'van' ? 8 : 3, passengerCount + 1))} className="w-8 h-8 flex items-center justify-center bg-gray-200 text-gray-900 font-bold rounded hover:bg-gray-300">+</button>
                   </div>
                </div>

                {/* BOUTON SUIVANT */}
                <div className="flex justify-end pt-6">
                  <button
                    type="button"
                    onClick={goToNextStep}
                    disabled={!validateStep1()}
                    className={`px-6 py-3 rounded-lg font-medium text-white transition-all ${
                      validateStep1() ? 'bg-blue-600 hover:bg-blue-700 shadow-lg' : 'bg-gray-300 cursor-not-allowed'
                    }`}
                  >
                    Continuer ➜
                  </button>
                </div>
              </div>
            )}

            {/* ÉTAPE 2 : INFORMATIONS (Structure simplifiée pour la lisibilité) */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input {...register('prenom')} placeholder="Prénom *" className="p-3 border rounded text-gray-900 font-medium" />
                  <input {...register('nom')} placeholder="Nom *" className="p-3 border rounded text-gray-900 font-medium" />
                  <input {...register('telephone')} placeholder="Téléphone *" className="p-3 border rounded text-gray-900 font-medium" />
                  <input {...register('email')} placeholder="Email *" className="p-3 border rounded text-gray-900 font-medium" />
                </div>
                <div className="flex justify-between pt-6">
                  <button type="button" onClick={goToPreviousStep} className="text-gray-600 hover:text-gray-900">← Retour</button>
                  <button type="button" onClick={goToNextStep} disabled={!validateStep2()} className={`px-6 py-3 rounded-lg text-white ${validateStep2() ? 'bg-blue-600' : 'bg-gray-300'}`}>Vers le paiement</button>
                </div>
              </div>
            )}

            {/* ÉTAPE 3 : PAIEMENT */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center bg-blue-50 p-6 rounded-lg mb-6">
                  <div className="text-3xl font-bold text-blue-900">{(paymentAmount / 100).toFixed(2)} €</div>
                  <div className="text-sm text-gray-600">Montant estimé</div>
                </div>

                <div className="flex gap-4 justify-center">
                   <button type="button" onClick={() => setPaymentMethod('immediate')} className={`flex-1 p-4 border rounded-xl font-bold transition-all ${
       paymentMethod === 'immediate' 
         ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-600' 
         : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
     }`}>💳 Carte Bancaire</button>
                   <button type="button" onClick={() => setPaymentMethod('sur-place')} className={`flex-1 p-4 border rounded-xl font-bold transition-all ${
       paymentMethod === 'sur-place' 
         ? 'border-green-600 bg-green-50 text-green-900 ring-2 ring-green-600' 
         : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
     }`}>💶 Sur place</button>
                </div>

                {paymentMethod === 'immediate' && !paymentSuccess && (
                   <div className="p-4 border rounded-xl mt-4">
                      <StripePaymentForm amount={paymentAmount} onSuccess={handlePaymentSuccess} onError={handlePaymentError} />
                   </div>
                )}

                <label className="flex items-center gap-2 mt-4">
                  <input type="checkbox" {...register('accepteConditions')} />
                  <span className="text-sm font-bold text-gray-900">J'accepte les conditions générales</span>
                </label>

                <div className="flex justify-between pt-6">
                  <button type="button" onClick={goToPreviousStep} className="text-gray-700 font-semibold hover:text-gray-900 px-4 py-2">← Retour</button>
                  <button type={paymentMethod === 'sur-place' ? 'submit' : 'button'} disabled={!validateStep3() ||  paymentAmount === 0 || (paymentMethod === 'immediate' && !paymentSuccess)} className={`px-6 py-3 rounded-lg font-bold text-white shadow-sm transition-all ${
      validateStep3() 
        ? 'bg-green-600 hover:bg-green-700 hover:shadow-lg transform hover:-translate-y-0.5' 
        : 'bg-gray-400 cursor-not-allowed opacity-70' 
    }`}>
                    {paymentMethod === 'immediate' && paymentSuccess ? '✅ Réservation Confirmée' : 'Confirmer la réservation'}
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