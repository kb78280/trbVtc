import { z } from 'zod'
import DOMPurify from 'dompurify'

// Fonction de sanitisation pour éviter les attaques XSS
export const sanitizeInput = (input: string): string => {
  if (typeof window !== 'undefined') {
    return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] })
  }
  // Côté serveur : nettoyage basique
  return input
    .replace(/[<>\"']/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
}

// Validation des emails avec regex stricte
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

// Validation des numéros de téléphone français
const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/

// Schémas de validation Zod
export const reservationSchema = z.object({
  serviceType: z.enum(['transfert', 'mise-a-disposition']),
  vehicleType: z.enum(['confort', 'van']),
  depart: z
    .string()
    .min(3, 'Le lieu de départ doit contenir au moins 3 caractères')
    .max(200, 'Le lieu de départ ne peut pas dépasser 200 caractères')
    .transform(sanitizeInput),
  arrivee: z
    .string()
    .min(3, 'Le lieu d\'arrivée doit contenir au moins 3 caractères')
    .max(200, 'Le lieu d\'arrivée ne peut pas dépasser 200 caractères')
    .transform(sanitizeInput),
  date: z
    .string()
    .refine((date) => {
      const selectedDate = new Date(date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return selectedDate >= today
    }, 'La date ne peut pas être dans le passé'),
  heure: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format d\'heure invalide'),
  passagers: z
    .union([z.string(), z.number()])
    .transform((val) => typeof val === 'string' ? parseInt(val) : val)
    .refine((n) => n >= 1 && n <= 8, 'Le nombre de passagers doit être entre 1 et 8'),
  bagages: z
    .union([z.string(), z.number()])
    .transform((val) => typeof val === 'string' ? parseInt(val) : val)
    .refine((n) => n >= 0 && n <= 3, 'Le nombre de bagages doit être entre 0 et 3'),
  duree: z
    .union([z.string(), z.number()])
    .transform((val) => typeof val === 'string' ? parseInt(val) : val)
    .refine((n) => n >= 2 && n <= 24, 'La durée doit être entre 2 et 24 heures')
    .optional(),
  prenom: z
    .string()
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(50, 'Le prénom ne peut pas dépasser 50 caractères')
    .regex(/^[a-zA-ZÀ-ÿ\s-]+$/, 'Le prénom ne peut contenir que des lettres, espaces et tirets')
    .transform(sanitizeInput),
  nom: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom ne peut pas dépasser 50 caractères')
    .regex(/^[a-zA-ZÀ-ÿ\s-]+$/, 'Le nom ne peut contenir que des lettres, espaces et tirets')
    .transform(sanitizeInput),
  telephone: z
    .string()
    .regex(phoneRegex, 'Format de téléphone invalide')
    .transform(sanitizeInput),
  email: z
    .string()
    .regex(emailRegex, 'Format d\'email invalide')
    .max(100, 'L\'email ne peut pas dépasser 100 caractères')
    .transform(sanitizeInput),
  commentaires: z
    .string()
    .max(500, 'Les commentaires ne peuvent pas dépasser 500 caractères')
    .transform(sanitizeInput)
    .optional(),
  // Options facultatives
  siegeEnfant: z
    .union([z.string(), z.number()])
    .transform((val) => typeof val === 'string' ? parseInt(val) : val)
    .refine((n) => n >= 0 && n <= 5, 'Le nombre de sièges enfant doit être entre 0 et 5')
    .optional(),
  bouquetFleurs: z
    .union([z.string(), z.boolean()])
    .transform((val) => typeof val === 'string' ? val === 'true' : val)
    .optional(),
  assistanceAeroport: z
    .union([z.string(), z.boolean()])
    .transform((val) => typeof val === 'string' ? val === 'true' : val)
    .optional(),
  etapes: z
    .array(z.string().transform(sanitizeInput))
    .max(10, 'Maximum 10 étapes autorisées')
    .optional()
}).superRefine((data, ctx) => {
  // Validation conditionnelle des passagers selon le type de véhicule
  const maxPassagers = data.vehicleType === 'van' ? 8 : 3
  if (data.passagers > maxPassagers) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Le véhicule ${data.vehicleType === 'van' ? 'Van' : 'Confort'} peut accueillir maximum ${maxPassagers} passagers`,
      path: ['passagers']
    })
  }
})

export const contactSchema = z.object({
  prenom: z
    .string()
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(50, 'Le prénom ne peut pas dépasser 50 caractères')
    .regex(/^[a-zA-ZÀ-ÿ\s-]+$/, 'Le prénom ne peut contenir que des lettres, espaces et tirets')
    .transform(sanitizeInput),
  nom: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom ne peut pas dépasser 50 caractères')
    .regex(/^[a-zA-ZÀ-ÿ\s-]+$/, 'Le nom ne peut contenir que des lettres, espaces et tirets')
    .transform(sanitizeInput),
  email: z
    .string()
    .regex(emailRegex, 'Format d\'email invalide')
    .max(100, 'L\'email ne peut pas dépasser 100 caractères')
    .transform(sanitizeInput),
  telephone: z
    .string()
    .regex(phoneRegex, 'Format de téléphone invalide')
    .transform(sanitizeInput)
    .optional(),
  sujet: z.enum(['reservation', 'information', 'reclamation', 'partenariat', 'autre']),
  message: z
    .string()
    .min(10, 'Le message doit contenir au moins 10 caractères')
    .max(1000, 'Le message ne peut pas dépasser 1000 caractères')
    .transform(sanitizeInput)
})

export type ReservationFormData = z.infer<typeof reservationSchema>
export type ContactFormData = z.infer<typeof contactSchema>
