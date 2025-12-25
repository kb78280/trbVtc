export interface LocationResult {
    label: string;      // L'adresse affichée (ex: "10 Rue de la Paix, Paris")
    lat: number;        // Latitude
    lng: number;        // Longitude
    place_id?: string;  // ID unique (optionnel)
  }