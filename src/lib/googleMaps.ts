import { Loader } from '@googlemaps/js-api-loader'

// Service singleton pour Google Maps
class GoogleMapsService {
  private static instance: GoogleMapsService
  private loader: Loader | null = null
  private isLoaded = false
  private loadingPromise: Promise<void> | null = null

  private constructor() {}

  static getInstance(): GoogleMapsService {
    if (!GoogleMapsService.instance) {
      GoogleMapsService.instance = new GoogleMapsService()
    }
    return GoogleMapsService.instance
  }

  async loadGoogleMaps(): Promise<void> {
    // Si déjà chargé, retourner immédiatement
    if (this.isLoaded) {
      return Promise.resolve()
    }

    // Si en cours de chargement, retourner la promesse existante
    if (this.loadingPromise) {
      return this.loadingPromise
    }

    // Créer une nouvelle promesse de chargement
    this.loadingPromise = this.initializeLoader()
    return this.loadingPromise
  }

  private async initializeLoader(): Promise<void> {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      
      if (!apiKey) {
        throw new Error('Clé API Google Maps manquante')
      }

      // Créer le loader une seule fois avec toutes les libraries nécessaires
      this.loader = new Loader({
        apiKey,
        version: 'weekly',
        libraries: ['places', 'geometry'], // Toutes les libraries nécessaires
        language: 'fr',
        region: 'FR'
      })

      await this.loader.load()
      this.isLoaded = true
    } catch (error) {
      this.loadingPromise = null // Réinitialiser en cas d'erreur
      throw error
    }
  }

  isGoogleMapsLoaded(): boolean {
    return this.isLoaded && typeof google !== 'undefined'
  }

  // Méthode utilitaire pour créer une autocomplétion
  createAutocomplete(input: HTMLInputElement, options?: google.maps.places.AutocompleteOptions): google.maps.places.Autocomplete {
    if (!this.isGoogleMapsLoaded()) {
      throw new Error('Google Maps n\'est pas encore chargé')
    }

    const defaultOptions: google.maps.places.AutocompleteOptions = {
      componentRestrictions: { country: 'fr' },
      fields: [
        'address_components',
        'formatted_address',
        'geometry',
        'name',
        'place_id'
      ],
      types: ['address']
    }

    return new google.maps.places.Autocomplete(input, { ...defaultOptions, ...options })
  }

  // Méthode utilitaire pour créer une carte
  createMap(element: HTMLElement, options?: google.maps.MapOptions): google.maps.Map {
    if (!this.isGoogleMapsLoaded()) {
      throw new Error('Google Maps n\'est pas encore chargé')
    }

    const defaultOptions: google.maps.MapOptions = {
      zoom: 12,
      center: { lat: 48.8566, lng: 2.3522 }, // Paris
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    }

    return new google.maps.Map(element, { ...defaultOptions, ...options })
  }

  // Méthode utilitaire pour créer un service de directions
  createDirectionsService(): google.maps.DirectionsService {
    if (!this.isGoogleMapsLoaded()) {
      throw new Error('Google Maps n\'est pas encore chargé')
    }
    return new google.maps.DirectionsService()
  }

  // Méthode utilitaire pour créer un renderer de directions
  createDirectionsRenderer(options?: google.maps.DirectionsRendererOptions): google.maps.DirectionsRenderer {
    if (!this.isGoogleMapsLoaded()) {
      throw new Error('Google Maps n\'est pas encore chargé')
    }

    const defaultOptions: google.maps.DirectionsRendererOptions = {
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: '#2563eb', // Bleu
        strokeWeight: 4,
        strokeOpacity: 0.8
      }
    }

    return new google.maps.DirectionsRenderer({ ...defaultOptions, ...options })
  }
}

// Exporter l'instance singleton
export const googleMapsService = GoogleMapsService.getInstance()
