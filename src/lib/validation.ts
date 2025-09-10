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
  depart: z
    .string()
    .min(3, 'Le lieu de départ doit contenir au moins 3 caractères')
    .max(200, 'Le lieu de départ ne peut pas dépasser 200 caractères')
    .transform(sanitizeInput),
  arrivee: z
    .string()
    .max(200, 'Le lieu d\'arrivée ne peut pas dépasser 200 caractères')
    .transform(sanitizeInput)
    .optional(),
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
  duree: z
    .union([z.string(), z.number()])
    .transform((val) => typeof val === 'string' ? parseInt(val) : val)
    .refine((n) => n >= 1 && n <= 24, 'La durée doit être entre 1 et 24 heures')
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
    .optional()
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
