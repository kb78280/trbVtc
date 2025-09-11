'use client'
import { useEffect, useRef, useState } from 'react'
import { googleMapsService } from '@/lib/googleMaps'

interface EtapeAutocompleteProps {
  value: string
  onChange: (value: string, placeDetails?: google.maps.places.PlaceResult) => void
  onError?: (error: string) => void
  placeholder: string
  disabled?: boolean
}

export default function EtapeAutocomplete({
  value,
  onChange,
  onError,
  placeholder,
  disabled = false
}: EtapeAutocompleteProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState('')
  const [internalValue, setInternalValue] = useState('')
  const [isSelecting, setIsSelecting] = useState(false)
  const [isAutocompleted, setIsAutocompleted] = useState(false)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  // Initialisation Google Maps
  useEffect(() => {
    const initializeAutocomplete = async () => {
      try {
        await googleMapsService.loadGoogleMaps()
        
        if (inputRef.current && window.google?.maps?.places?.Autocomplete) {
          const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
            types: ['address'],
            componentRestrictions: { country: 'fr' },
            fields: ['formatted_address', 'geometry', 'place_id', 'name']
          })

          autocompleteRef.current = autocomplete

          autocomplete.addListener('place_changed', () => {
            setIsSelecting(true)
            const place = autocomplete.getPlace()
            
            console.log('🟡 [ETAPE] 🎯 PLACE_CHANGED détecté:', {
              hasPlace: !!place,
              formatted_address: place?.formatted_address || 'missing',
              hasGeometry: !!place?.geometry,
              geometryLocation: place?.geometry?.location ? 'present' : 'missing',
              place_id: place?.place_id || 'missing'
            })

            if (!place.formatted_address) {
              console.warn('🟡 [ETAPE] ❌ Place sans formatted_address:', place)
              setIsSelecting(false)
              return
            }

            setError('')
            const formattedAddress = place.formatted_address || ''
            
            if (formattedAddress) {
              console.log('🟡 [ETAPE] ✅ AUTOCOMPLETE SUCCESS - Appel onChange:', {
                formattedAddress,
                hasGeometry: !!place.geometry,
                geometryLocation: place.geometry?.location ? 'present' : 'missing',
                willPassPlaceDetails: true
              })
              
              setInternalValue(formattedAddress)
              setIsAutocompleted(true)
              
              if (inputRef.current) {
                inputRef.current.value = formattedAddress
              }
              
              // CRITIQUE: Passer les détails complets du lieu
              onChange(formattedAddress, place)
              
              setTimeout(() => {
                setIsSelecting(false)
              }, 100)
            } else {
              console.log('🟡 [ETAPE] ❌ Pas de formattedAddress valide')
              setIsSelecting(false)
            }
          })

          setIsLoaded(true)
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement de Google Maps'
        setError(errorMessage)
        onError?.(errorMessage)
      }
    }

    initializeAutocomplete()

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current)
      }
    }
  }, [onChange, onError])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    console.log('🟡 [ETAPE] 👤 USER TYPING:', newValue)
    
    setInternalValue(newValue)
    setIsAutocompleted(false)
    onChange(newValue)
    
    if (error) {
      setError('')
    }
  }

  // Protection des valeurs autocompletées
  useEffect(() => {
    if (inputRef.current && isAutocompleted) {
      if (inputRef.current.value !== internalValue) {
        console.log('🟡 [ETAPE] PROTECTING AUTOCOMPLETED VALUE - Restoring:', internalValue)
        inputRef.current.value = internalValue
      }
    }
  })

  // Synchronisation avec la valeur externe
  useEffect(() => {
    if (value === '' && internalValue !== '') {
      console.log('🟡 [ETAPE] RESET externe détecté')
      setInternalValue('')
      setIsAutocompleted(false)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    } else if (value !== '' && value !== internalValue) {
      console.log('🟡 [ETAPE] SYNC externe:', { value, internalValue })
      setInternalValue(value)
      if (inputRef.current) {
        inputRef.current.value = value
      }
    }
  }, [value]) // Seulement value dans les deps, pas internalValue

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={internalValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3"
        disabled={disabled || !isLoaded}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {!isLoaded && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  )
}
