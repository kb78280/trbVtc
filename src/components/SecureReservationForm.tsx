'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { reservationSchema } from '@/lib/validation'
import { CSRFProtection, RateLimiter, SecurityMonitor, HoneypotProtection } from '@/lib/security'
import DepartureAutocomplete from '@/components/DepartureAutocomplete'
import ArrivalAutocomplete from '@/components/ArrivalAutocomplete'
import EtapeAutocomplete from '@/components/EtapeAutocomplete'
import InteractiveMap from '@/components/InteractiveMap'

type ServiceType = 'transfert' | 'mise-a-disposition'
type VehicleType = 'confort' | 'van'

// Type pour le formulaire (avant transformation)
type FormData = {
  serviceType: ServiceType
  vehicleType: VehicleType
  depart: string
  arrivee: string
  date: string
  heure: string
  passagers: string
  bagages: string
  duree?: string
  prenom: string
  nom: string
  telephone: string
  email: string
  commentaires?: string
  etapes?: string[]
  // Options facultatives
  siegeEnfant?: string
  bouquetFleurs?: boolean
  assistanceAeroport?: boolean
}

export default function SecureReservationForm() {
  const [mounted, setMounted] = useState(false)
  const [serviceType, setServiceType] = useState<ServiceType>('transfert')
  const [vehicleType, setVehicleType] = useState<VehicleType>('confort')
  const [csrfToken, setCsrfToken] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [rateLimitInfo, setRateLimitInfo] = useState<{ blocked: boolean; timeLeft: number }>({
    blocked: false,
    timeLeft: 0
  })

  // États pour Google Maps
  const [originPlace, setOriginPlace] = useState<google.maps.places.PlaceResult | null>(null)
  const [destinationPlace, setDestinationPlace] = useState<google.maps.places.PlaceResult | null>(null)
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null)
  
  // États d'autocomplétion pour l'affichage de la carte (PAS de valeurs texte)
  const [isDepartAutocompleted, setIsDepartAutocompleted] = useState(false)
  const [isArriveeAutocompleted, setIsArriveeAutocompleted] = useState(false)
  
  // Références pour les valeurs finales (pas de re-render)
  const departValueRef = useRef('')
  const arriveeValueRef = useRef('')
  
  // État pour les étapes (mise-à-disposition uniquement)
  const [etapes, setEtapes] = useState<{id: number, value: string}[]>([{id: 0, value: ''}])
  const [etapesPlaces, setEtapesPlaces] = useState<(google.maps.places.PlaceResult | null)[]>([null])
  const [nextEtapeId, setNextEtapeId] = useState(1)
  
  // Clés pour forcer le re-render des composants d'autocomplétion
  const [departKey, setDepartKey] = useState(0)
  const [arriveeKey, setArriveeKey] = useState(0)
  const [etapesKey, setEtapesKey] = useState(0)

  // Debug: Log des changements d'états (SANS re-render)
  useEffect(() => {
    console.log('🏠 [PARENT] Autocomplete states:', { isDepartAutocompleted, isArriveeAutocompleted })
  }, [isDepartAutocompleted, isArriveeAutocompleted])

  useEffect(() => {
    console.log('🗺️ [MAP] State change - originPlace:', originPlace?.formatted_address || 'null')
    console.log('🗺️ [MAP] Has geometry:', !!originPlace?.geometry)
  }, [originPlace])

  useEffect(() => {
    console.log('🗺️ [MAP] State change - destinationPlace:', destinationPlace?.formatted_address || 'null')
    console.log('🗺️ [MAP] Has geometry:', !!destinationPlace?.geometry)
  }, [destinationPlace])

  useEffect(() => {
    const canShowMap = isDepartAutocompleted || (serviceType === 'transfert' && isArriveeAutocompleted)
    console.log('🗺️ [MAP] Can show map?', {
      isDepartAutocompleted,
      isArriveeAutocompleted,
      serviceType,
      canShowMap,
      rule: 'Au moins un input autocompléé'
    })
  }, [isDepartAutocompleted, isArriveeAutocompleted, serviceType])

  const honeypot = HoneypotProtection.createHoneypot()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<FormData>({
    defaultValues: {
      serviceType: 'transfert',
      vehicleType: 'confort',
      passagers: '1',
      bagages: '0',
      duree: '2',
      siegeEnfant: '0',
      bouquetFleurs: false,
      assistanceAeroport: false
    }
  })

  useEffect(() => {
    setMounted(true)
    const token = CSRFProtection.setToken()
    setCsrfToken(token)
    
    // Vérifier le rate limiting
    const checkRateLimit = () => {
      const canSubmit = RateLimiter.canSubmit('reservation')
      if (!canSubmit) {
        const timeLeft = RateLimiter.getTimeUntilNextSubmission('reservation')
        setRateLimitInfo({ blocked: true, timeLeft })
      }
    }
    
    checkRateLimit()
    const interval = setInterval(checkRateLimit, 60000) // Vérifier chaque minute
    
    return () => clearInterval(interval)
  }, [])

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true)
      setSubmitError('')

      // Synchroniser les valeurs d'adresse avec React Hook Form AVANT soumission
      const currentDepartValue = departValueRef.current
      const currentArriveeValue = arriveeValueRef.current
      
      console.log('[FORM] Syncing addresses before submit:', { 
        currentDepartValue, 
        currentArriveeValue 
      })
      
      setValue('depart', currentDepartValue)
      setValue('arrivee', currentArriveeValue)

      // Validation manuelle des adresses
      if (!currentDepartValue.trim()) {
        throw new Error('L\'adresse de départ est requise.')
      }
      if (!currentArriveeValue.trim()) {
        throw new Error('L\'adresse d\'arrivée est requise.')
      }

      // Vérification CSRF
      if (!CSRFProtection.validateToken(csrfToken)) {
        throw new Error('Token CSRF invalide. Veuillez recharger la page.')
      }

      // Vérification rate limiting
      if (!RateLimiter.canSubmit('reservation')) {
        throw new Error('Trop de tentatives. Veuillez patienter avant de soumettre à nouveau.')
      }

      // Vérification honeypot
      const honeypotField = document.querySelector(`input[name="${honeypot.name}"]`) as HTMLInputElement
      if (HoneypotProtection.isBot(honeypotField?.value || '')) {
        SecurityMonitor.logSuspiciousActivity('honeypot', 'Bot détecté via honeypot')
        throw new Error('Soumission invalide.')
      }

      // Détection de contenu suspect
      const allValues = Object.values(data).join(' ')
      if (SecurityMonitor.detectSuspiciousContent(allValues)) {
        SecurityMonitor.logSuspiciousActivity('malicious_content', allValues)
        throw new Error('Contenu suspect détecté.')
      }

      // Validation des données côté client
      const validatedData = reservationSchema.parse({
        ...data,
        serviceType,
        etapes: serviceType === 'mise-a-disposition' ? etapes.map(e => e.value).filter(value => value.trim() !== '') : undefined
      })

      // Simulation d'envoi (remplacer par votre API)
      console.log('Données validées et sécurisées:', validatedData)
      
      // Enregistrer la soumission pour le rate limiting
      RateLimiter.recordSubmission('reservation')
      
      // Simuler un délai d'API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      alert('Réservation envoyée avec succès ! Redirection vers le calcul du prix...')
      reset()
      
      // Réinitialiser les états locaux
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
    
    // Reset des états d'autocomplétion
    setIsDepartAutocompleted(false)
    setIsArriveeAutocompleted(false)
    
    // Reset Google Maps
    setOriginPlace(null)
    setDestinationPlace(null)
    setRouteInfo(null)
    
    // Reset des étapes
    setEtapes([{id: 0, value: ''}])
    setEtapesPlaces([null])
    setNextEtapeId(1)
    
    // Forcer le re-render des composants d'autocomplétion
    setDepartKey(prev => prev + 1)
    setArriveeKey(prev => prev + 1)
    setEtapesKey(prev => prev + 1)
  }

  const handleServiceTypeChange = (type: ServiceType) => {
    console.log('🔄 [FORM] Changement de type de service:', { from: serviceType, to: type })
    
    // Reset complet du formulaire
    resetCompleteForm()
    
    // Définir le nouveau type
    setServiceType(type)
    setValue('serviceType', type)
  }

  const handleVehicleTypeChange = (type: VehicleType) => {
    setVehicleType(type)
    setValue('vehicleType', type)
    
    // Adapter le nombre de passagers selon le véhicule
    const maxPassagers = type === 'van' ? 8 : 3
    const currentPassagers = watch('passagers')
    
    // Si le nombre actuel dépasse la limite, l'ajuster
    if (currentPassagers && parseInt(currentPassagers) > maxPassagers) {
      setValue('passagers', maxPassagers.toString())
    }
  }

  // Fonction pour calculer le prix estimé
  const calculateEstimatedPrice = () => {
    const basePrice = vehicleType === 'van' ? 80 : 50
    const passagersCount = parseInt(watch('passagers') || '1')
    const serviceMultiplier = serviceType === 'mise-a-disposition' ? 1.5 : 1
    const siegeEnfantCount = parseInt(watch('siegeEnfant') || '0')
    const bouquetFleurs = watch('bouquetFleurs') || false
    const assistanceAeroport = watch('assistanceAeroport') || false
    
    let estimatedPrice = basePrice + (passagersCount - 1) * 10
    estimatedPrice *= serviceMultiplier
    estimatedPrice += siegeEnfantCount * 10
    if (bouquetFleurs) estimatedPrice += 75
    if (assistanceAeroport) estimatedPrice += 120
    
    return Math.round(estimatedPrice)
  }

  // Fonctions pour gérer les étapes
  const addEtape = () => {
    if (etapes.length < 10) {
      setEtapes([...etapes, {id: nextEtapeId, value: ''}])
      setEtapesPlaces([...etapesPlaces, null])
      setNextEtapeId(prev => prev + 1)
    }
  }

  const removeEtape = (index: number) => {
    if (etapes.length > 1) {
      const newEtapes = etapes.filter((_, i) => i !== index)
      const newEtapesPlaces = etapesPlaces.filter((_, i) => i !== index)
      setEtapes(newEtapes)
      setEtapesPlaces(newEtapesPlaces)
    }
  }

  const updateEtape = (index: number, value: string, placeDetails?: google.maps.places.PlaceResult) => {
    const newEtapes = [...etapes]
    const newEtapesPlaces = [...etapesPlaces]
    
    newEtapes[index] = {...newEtapes[index], value}
    newEtapesPlaces[index] = placeDetails || null
    
    setEtapes(newEtapes)
    setEtapesPlaces(newEtapesPlaces)
    
    console.log('🟡 [ETAPES] Updated:', { 
      index, 
      etapeId: newEtapes[index].id,
      value, 
      hasPlace: !!placeDetails,
      placeDetails: placeDetails ? {
        formatted_address: placeDetails.formatted_address,
        hasGeometry: !!placeDetails.geometry,
        geometryLocation: placeDetails.geometry?.location ? 'present' : 'missing'
      } : null,
      totalValidPlaces: newEtapesPlaces.filter(p => p !== null).length,
      allEtapesPlaces: newEtapesPlaces.map((p, i) => ({
        index: i,
        hasPlace: !!p,
        address: p?.formatted_address || 'null',
        hasGeometry: !!p?.geometry
      }))
    })
  }

  // Fonction mémorisée pour éviter les re-renders de InteractiveMap
  const handleRouteCalculated = useCallback((distance: string, duration: string) => {
    console.log('🗺️ [PARENT] Route calculée:', { distance, duration })
    setRouteInfo({ distance, duration })
  }, [])

  // Tableau vide stable pour éviter les re-renders
  const emptyWaypoints = useMemo(() => [], [])
  
  // Waypoints mémorisés pour éviter les recalculs inutiles
  const memoizedValidWaypoints = useMemo(() => {
    console.log('🗺️ [PARENT] RECALCUL waypoints - serviceType:', serviceType)
    
    if (serviceType !== 'mise-a-disposition') {
      console.log('🗺️ [PARENT] Pas de waypoints (service transfert) - Retour tableau stable')
      return emptyWaypoints
    }
    
    console.log('🗺️ [PARENT] ANALYSE etapesPlaces:', {
      totalEtapes: etapesPlaces.length,
      detailsEtapes: etapesPlaces.map((place, i) => ({
        index: i,
        isNull: place === null,
        hasPlace: !!place,
        address: place?.formatted_address || 'null',
        hasGeometry: !!place?.geometry,
        geometryLocation: place?.geometry?.location ? 'present' : 'missing'
      }))
    })
    
    const validPlaces = etapesPlaces.filter(place => place !== null && place.geometry && place.geometry.location) as google.maps.places.PlaceResult[]
    
    console.log('🗺️ [PARENT] Waypoints FILTRÉS:', {
      totalEtapes: etapesPlaces.length,
      nonNullPlaces: etapesPlaces.filter(p => p !== null).length,
      validPlacesWithGeometry: validPlaces.length,
      addresses: validPlaces.map(p => p.formatted_address),
      willReturnEmptyArray: validPlaces.length === 0
    })
    
    // Retourner le tableau stable si aucun waypoint valide
    return validPlaces.length === 0 ? emptyWaypoints : validPlaces
  }, [serviceType, etapesPlaces, emptyWaypoints])

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
            Formulaire de réservation sécurisé
          </h2>
          
          {/* Affichage des erreurs de rate limiting */}
          {rateLimitInfo.blocked && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700">
                Trop de tentatives de soumission. Veuillez patienter {Math.ceil(rateLimitInfo.timeLeft / 60000)} minute(s).
              </p>
            </div>
          )}
          
          {/* Choix du service */}
          <div className="mb-8">
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleServiceTypeChange('transfert')}
                disabled={rateLimitInfo.blocked}
                className={`p-4 rounded-lg border-2 text-center transition-colors disabled:opacity-50 ${
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
                onClick={() => handleServiceTypeChange('mise-a-disposition')}
                disabled={rateLimitInfo.blocked}
                className={`p-4 rounded-lg border-2 text-center transition-colors disabled:opacity-50 ${
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

          {/* Choix du véhicule */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Type de véhicule</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleVehicleTypeChange('confort')}
                disabled={rateLimitInfo.blocked}
                className={`p-4 rounded-lg border-2 text-center transition-colors disabled:opacity-50 ${
                  vehicleType === 'confort'
                    ? 'border-blue-600 bg-blue-50 text-blue-900'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                <div className="font-semibold">Voiture Confort</div>
                <div className="text-sm mt-1">1-3 passagers</div>
                <div className="text-xs mt-1 text-gray-500">À partir de 50€</div>
              </button>
              <button
                type="button"
                onClick={() => handleVehicleTypeChange('van')}
                disabled={rateLimitInfo.blocked}
                className={`p-4 rounded-lg border-2 text-center transition-colors disabled:opacity-50 ${
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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Champ honeypot caché */}
            <input
              name={honeypot.name}
              style={honeypot.style}
              tabIndex={-1}
              autoComplete="off"
            />
            
            {/* Token CSRF caché */}
            <input type="hidden" value={csrfToken} />

            {/* Informations de trajet */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations de trajet</h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="depart" className="block text-sm font-medium text-gray-700 mb-1">
                    Lieu de départ *
                  </label>
                  <DepartureAutocomplete
                    key={departKey}
                    value="" // Pas de synchronisation externe
                    onChange={(value, placeDetails, isAutocompleted) => {
                      console.log('🏠 [PARENT] 📨 DEPART onChange:', { value, hasPlace: !!placeDetails, isAutocompleted })
                      
                      // ✅ AUCUN setState pour la valeur → AUCUN re-render
                      departValueRef.current = value
                      setIsDepartAutocompleted(!!isAutocompleted)
                      
                      if (placeDetails && placeDetails.geometry) {
                        console.log('🏠 [PARENT] ✅ DEPART place avec géométrie:', placeDetails.formatted_address)
                        setOriginPlace(placeDetails)
                      } else {
                        console.log('🏠 [PARENT] ❌ DEPART pas de géométrie, clearing place')
                        setOriginPlace(null)
                      }
                    }}
                    className=""
                    required
                    disabled={rateLimitInfo.blocked || isSubmitting}
                  />
                  {/* Validation manuelle des adresses - pas d'erreurs React Hook Form */}
                </div>

                <div>
                  <label htmlFor="arrivee" className="block text-sm font-medium text-gray-700 mb-1">
                    Lieu d'arrivée *
                  </label>
                  <ArrivalAutocomplete
                    key={arriveeKey}
                    value="" // Pas de synchronisation externe
                    onChange={(value, placeDetails, isAutocompleted) => {
                      console.log('🏠 [PARENT] 📨 ARRIVEE onChange:', { value, hasPlace: !!placeDetails, isAutocompleted })
                      
                      // ✅ AUCUN setState pour la valeur → AUCUN re-render
                      arriveeValueRef.current = value
                      setIsArriveeAutocompleted(!!isAutocompleted)
                      
                      if (placeDetails && placeDetails.geometry) {
                        console.log('🏠 [PARENT] ✅ ARRIVEE place avec géométrie:', placeDetails.formatted_address)
                        setDestinationPlace(placeDetails)
                      } else {
                        console.log('🏠 [PARENT] ❌ ARRIVEE pas de géométrie, clearing place')
                        setDestinationPlace(null)
                      }
                    }}
                    className=""
                    required
                    disabled={rateLimitInfo.blocked || isSubmitting}
                  />
                  {/* Validation manuelle des adresses - pas d'erreurs React Hook Form */}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                      Date *
                    </label>
                    <input
                      {...register('date')}
                      type="date"
                      id="date"
                      min={new Date().toISOString().split('T')[0]}
                      className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 ${
                        errors.date ? 'border-red-500' : ''
                      }`}
                      disabled={rateLimitInfo.blocked || isSubmitting}
                    />
                    {errors.date && (
                      <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="heure" className="block text-sm font-medium text-gray-700 mb-1">
                      Heure *
                    </label>
                    <input
                      {...register('heure')}
                      type="time"
                      id="heure"
                      className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 ${
                        errors.heure ? 'border-red-500' : ''
                      }`}
                      disabled={rateLimitInfo.blocked || isSubmitting}
                    />
                    {errors.heure && (
                      <p className="mt-1 text-sm text-red-600">{errors.heure.message}</p>
                    )}
                  </div>
                </div>

                <div className={`grid gap-4 items-end ${serviceType === 'mise-a-disposition' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                  <div className="flex flex-col">
                    <label htmlFor="passagers" className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de passagers
                    </label>
                    <select
                      {...register('passagers')}
                      id="passagers"
                      className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 ${
                        errors.passagers ? 'border-red-500' : ''
                      }`}
                      disabled={rateLimitInfo.blocked || isSubmitting}
                    >
                      {Array.from({ length: vehicleType === 'van' ? 8 : 3 }, (_, i) => i + 1).map(num => (
                        <option key={num} value={num}>{num} passager{num > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                    <div className="mt-1 h-6 flex items-start">
                      {errors.passagers && (
                        <p className="text-sm text-red-600">{errors.passagers.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <label htmlFor="bagages" className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de bagages
                    </label>
                    <select
                      {...register('bagages')}
                      id="bagages"
                      className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 ${
                        errors.bagages ? 'border-red-500' : ''
                      }`}
                      disabled={rateLimitInfo.blocked || isSubmitting}
                    >
                      {[0, 1, 2, 3].map(num => (
                        <option key={num} value={num}>{num} bagage{num > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                    <div className="mt-1 h-6 flex items-start">
                      {errors.bagages && (
                        <p className="text-sm text-red-600">{errors.bagages.message}</p>
                      )}
                    </div>
                  </div>

                  {serviceType === 'mise-a-disposition' && (
                    <div className="flex flex-col">
                      <label htmlFor="duree" className="block text-sm font-medium text-gray-700 mb-1">
                        Durée (heures)
                      </label>
                      <select
                        {...register('duree')}
                        id="duree"
                        className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 ${
                          errors.duree ? 'border-red-500' : ''
                        }`}
                        disabled={rateLimitInfo.blocked || isSubmitting}
                      >
                        {Array.from({length: 23}, (_, i) => i + 2).map(num => (
                          <option key={num} value={num}>{num} heure{num > 1 ? 's' : ''}</option>
                        ))}
                      </select>
                      <div className="mt-1 h-6 flex items-start">
                        {errors.duree && (
                          <p className="text-sm text-red-600">{errors.duree.message}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Carte interactive - Affichée dès qu'au moins une adresse est autocompletée */}
            {(isDepartAutocompleted || isArriveeAutocompleted) && originPlace && (
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {serviceType === 'transfert' ? 'Aperçu de votre trajet' : 'Aperçu de votre service'}
                </h3>
                
                <InteractiveMap
                  origin={originPlace}
                  destination={destinationPlace || undefined}
                  validWaypoints={memoizedValidWaypoints}
                  height="300px"
                  onRouteCalculated={handleRouteCalculated}
                />
                
                {routeInfo && (
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="font-semibold text-blue-900">Distance</div>
                      <div className="text-blue-700">{routeInfo.distance}</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="font-semibold text-green-900">Durée estimée</div>
                      <div className="text-green-700">{routeInfo.duration}</div>
                    </div>
                  </div>
                )}
                
                <div className="mt-3 text-xs text-gray-500">
                  💡 Les informations de trajet sont données à titre indicatif et peuvent varier selon le trafic.
                </div>
              </div>
            )}

            {/* ÉTAPES TEMPORAIREMENT MASQUÉES - À REPRENDRE PLUS TARD */}
            {false && serviceType === 'mise-a-disposition' && (
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Étapes du trajet</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Ajoutez jusqu'à 10 étapes pour votre trajet (optionnel)
                </p>
                
                <div className="space-y-3">
                  {etapes.map((etape, index) => (
                    <div key={etape.id} className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-800">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <EtapeAutocomplete
                          key={etape.id}
                          value={etape.value}
                          onChange={(value, placeDetails) => {
                            console.log('🟡 [PARENT] 📨 ETAPE onChange:', { index, etapeId: etape.id, value, hasPlace: !!placeDetails })
                            updateEtape(index, value, placeDetails)
                          }}
                          placeholder={`Étape ${index + 1} (optionnel)`}
                          disabled={rateLimitInfo.blocked || isSubmitting}
                        />
                      </div>
                      {etapes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEtape(index)}
                          className="flex-shrink-0 w-8 h-8 bg-red-100 hover:bg-red-200 rounded-full flex items-center justify-center text-red-600 transition-colors"
                          disabled={rateLimitInfo.blocked || isSubmitting}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {etapes.length < 10 && (
                    <button
                      type="button"
                      onClick={addEtape}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
                      disabled={rateLimitInfo.blocked || isSubmitting}
                    >
                      <span className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-sm">+</span>
                      Ajouter une étape
                    </button>
                  )}
                </div>
              </div>
            )}

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
                      {...register('prenom')}
                      type="text"
                      id="prenom"
                      className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 ${
                        errors.prenom ? 'border-red-500' : ''
                      }`}
                      disabled={rateLimitInfo.blocked || isSubmitting}
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
                      id="nom"
                      className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 ${
                        errors.nom ? 'border-red-500' : ''
                      }`}
                      disabled={rateLimitInfo.blocked || isSubmitting}
                    />
                    {errors.nom && (
                      <p className="mt-1 text-sm text-red-600">{errors.nom.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="telephone" className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone *
                  </label>
                  <input
                    {...register('telephone')}
                    type="tel"
                    id="telephone"
                    placeholder="06 12 34 56 78"
                    className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 ${
                      errors.telephone ? 'border-red-500' : ''
                    }`}
                    disabled={rateLimitInfo.blocked || isSubmitting}
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
                    id="email"
                    placeholder="votre@email.com"
                    className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 ${
                      errors.email ? 'border-red-500' : ''
                    }`}
                    disabled={rateLimitInfo.blocked || isSubmitting}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="commentaires" className="block text-sm font-medium text-gray-700 mb-1">
                    Commentaires ou demandes spéciales
                  </label>
                  <textarea
                    {...register('commentaires')}
                    id="commentaires"
                    rows={3}
                    placeholder="Informations supplémentaires..."
                    className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 ${
                      errors.commentaires ? 'border-red-500' : ''
                    }`}
                    disabled={rateLimitInfo.blocked || isSubmitting}
                  />
                  {errors.commentaires && (
                    <p className="mt-1 text-sm text-red-600">{errors.commentaires.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Options facultatives */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Options</h3>
              <p className="text-sm text-gray-600 mb-6">Ajoutez des services supplémentaires à votre réservation (facultatif)</p>
              
              <div className="space-y-6">
                {/* Sièges enfants */}
                <div className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Sièges enfants</h4>
                        <p className="text-sm text-gray-500">Pour enfants de 0 à 36 mois</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-green-600">€10.00</div>
                        <div className="text-xs text-gray-500">par siège</div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <select
                        {...register('siegeEnfant')}
                        className={`w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm ${
                          errors.siegeEnfant ? 'border-red-500' : ''
                        }`}
                        disabled={rateLimitInfo.blocked || isSubmitting}
                      >
                        {[0, 1, 2, 3, 4, 5].map(num => (
                          <option key={num} value={num}>{num}</option>
                        ))}
                      </select>
                    </div>
                    {errors.siegeEnfant && (
                      <p className="mt-2 text-sm text-red-600">{errors.siegeEnfant.message}</p>
                    )}
                  </div>
                </div>

                {/* Bouquet de fleurs */}
                <div className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Bouquet de fleurs</h4>
                        <p className="text-sm text-gray-500">Bouquet préparé par notre fleuriste local</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-green-600">€75.00</div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="flex items-center">
                        <input
                          {...register('bouquetFleurs')}
                          type="checkbox"
                          className={`rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                            errors.bouquetFleurs ? 'border-red-500' : ''
                          }`}
                          disabled={rateLimitInfo.blocked || isSubmitting}
                        />
                        <span className="ml-2 text-sm text-gray-900">Ajouter un bouquet de fleurs</span>
                      </label>
                    </div>
                    {errors.bouquetFleurs && (
                      <p className="mt-2 text-sm text-red-600">{errors.bouquetFleurs.message}</p>
                    )}
                  </div>
                </div>

                {/* Assistance Aéroport */}
                <div className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Assistance Aéroport</h4>
                        <p className="text-sm text-gray-500">Accompagnement complet jusqu'à la porte d'embarquement</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-green-600">€120.00</div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="flex items-center">
                        <input
                          {...register('assistanceAeroport')}
                          type="checkbox"
                          className={`rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                            errors.assistanceAeroport ? 'border-red-500' : ''
                          }`}
                          disabled={rateLimitInfo.blocked || isSubmitting}
                        />
                        <span className="ml-2 text-sm text-gray-900">Ajouter l'assistance aéroport</span>
                      </label>
                    </div>
                    {errors.assistanceAeroport && (
                      <p className="mt-2 text-sm text-red-600">{errors.assistanceAeroport.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Prix estimé */}
            {(vehicleType || routeInfo) && (
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Prix estimé</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type de véhicule:</span>
                      <span className="font-medium">
                        {vehicleType === 'van' ? 'Van (1-8 passagers)' : 'Confort (1-3 passagers)'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nombre de passagers:</span>
                      <span className="font-medium">{watch('passagers') || 1}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type de service:</span>
                      <span className="font-medium">
                        {serviceType === 'transfert' ? 'Transfert' : 'Mise à disposition'}
                      </span>
                    </div>
                  </div>
                  
                  {routeInfo && (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Distance:</span>
                        <span className="font-medium">{routeInfo.distance}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Durée estimée:</span>
                        <span className="font-medium">{routeInfo.duration}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Prix estimé:</span>
                    <span className="text-2xl font-bold text-green-600">
                      {calculateEstimatedPrice()} €
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Prix indicatif, le tarif final sera confirmé après validation de votre demande
                  </p>
                </div>
              </div>
            )}

            {/* Affichage des erreurs */}
            {submitError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700">{submitError}</p>
              </div>
            )}

            {/* Bouton de soumission */}
            <button
              type="submit"
              disabled={rateLimitInfo.blocked || isSubmitting}
              className="w-full bg-blue-600 text-white py-4 px-6 rounded-md text-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Traitement en cours...
                </span>
              ) : (
                'Voir le prix'
              )}
            </button>

            {/* Info sécurité */}
            <div className="text-center text-sm text-gray-500">
              <p>🔒 Formulaire sécurisé - Vos données sont protégées</p>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
