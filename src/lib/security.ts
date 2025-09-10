import Cookies from 'js-cookie'

// Protection CSRF
export class CSRFProtection {
  private static readonly TOKEN_NAME = 'csrf_token'
  private static readonly TOKEN_LENGTH = 32

  static generateToken(): string {
    const array = new Uint8Array(this.TOKEN_LENGTH)
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(array)
    } else {
      // Fallback pour les environnements sans crypto
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256)
      }
    }
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  static setToken(): string {
    const token = this.generateToken()
    if (typeof window !== 'undefined') {
      Cookies.set(this.TOKEN_NAME, token, { 
        expires: 1, // 1 jour
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      })
    }
    return token
  }

  static getToken(): string | undefined {
    if (typeof window !== 'undefined') {
      return Cookies.get(this.TOKEN_NAME)
    }
    return undefined
  }

  static validateToken(token: string): boolean {
    const storedToken = this.getToken()
    return storedToken === token && token.length === this.TOKEN_LENGTH * 2
  }
}

// Protection contre le spam et rate limiting
export class RateLimiter {
  private static readonly STORAGE_KEY = 'form_submissions'
  private static readonly MAX_SUBMISSIONS = 5
  private static readonly WINDOW_MS = 15 * 60 * 1000 // 15 minutes

  static canSubmit(formType: string): boolean {
    if (typeof window === 'undefined') return true

    const key = `${this.STORAGE_KEY}_${formType}`
    const stored = localStorage.getItem(key)
    
    if (!stored) return true

    try {
      const submissions = JSON.parse(stored) as number[]
      const now = Date.now()
      
      // Nettoyer les anciennes soumissions
      const recentSubmissions = submissions.filter(
        timestamp => now - timestamp < this.WINDOW_MS
      )

      if (recentSubmissions.length >= this.MAX_SUBMISSIONS) {
        return false
      }

      return true
    } catch {
      return true
    }
  }

  static recordSubmission(formType: string): void {
    if (typeof window === 'undefined') return

    const key = `${this.STORAGE_KEY}_${formType}`
    const stored = localStorage.getItem(key)
    const now = Date.now()

    try {
      let submissions: number[] = stored ? JSON.parse(stored) : []
      
      // Nettoyer les anciennes soumissions
      submissions = submissions.filter(
        timestamp => now - timestamp < this.WINDOW_MS
      )
      
      // Ajouter la nouvelle soumission
      submissions.push(now)
      
      localStorage.setItem(key, JSON.stringify(submissions))
    } catch {
      localStorage.setItem(key, JSON.stringify([now]))
    }
  }

  static getTimeUntilNextSubmission(formType: string): number {
    if (typeof window === 'undefined') return 0

    const key = `${this.STORAGE_KEY}_${formType}`
    const stored = localStorage.getItem(key)
    
    if (!stored) return 0

    try {
      const submissions = JSON.parse(stored) as number[]
      const now = Date.now()
      
      // Nettoyer les anciennes soumissions
      const recentSubmissions = submissions.filter(
        timestamp => now - timestamp < this.WINDOW_MS
      )

      if (recentSubmissions.length < this.MAX_SUBMISSIONS) {
        return 0
      }

      // Trouver la soumission la plus ancienne
      const oldestSubmission = Math.min(...recentSubmissions)
      const timeUntilReset = this.WINDOW_MS - (now - oldestSubmission)
      
      return Math.max(0, timeUntilReset)
    } catch {
      return 0
    }
  }
}

// Détection d'activité suspecte
export class SecurityMonitor {
  private static readonly SUSPICIOUS_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /eval\s*\(/gi,
    /expression\s*\(/gi,
    /<iframe\b[^>]*>/gi,
    /<object\b[^>]*>/gi,
    /<embed\b[^>]*>/gi,
    /data:text\/html/gi,
    /vbscript:/gi
  ]

  static detectSuspiciousContent(content: string): boolean {
    return this.SUSPICIOUS_PATTERNS.some(pattern => pattern.test(content))
  }

  static logSuspiciousActivity(type: string, content: string, userAgent?: string): void {
    if (typeof window !== 'undefined') {
      console.warn('🚨 Activité suspecte détectée:', {
        type,
        content: content.substring(0, 100),
        userAgent: userAgent || navigator.userAgent,
        timestamp: new Date().toISOString(),
        url: window.location.href
      })
      
      // En production, vous pourriez envoyer ceci à votre service de monitoring
      // fetch('/api/security/report', { method: 'POST', body: JSON.stringify(...) })
    }
  }
}

// Validation côté client pour les champs cachés (honeypot)
export class HoneypotProtection {
  static createHoneypot(): { name: string; style: React.CSSProperties } {
    return {
      name: 'website_url', // Nom qui attire les bots
      style: {
        position: 'absolute',
        left: '-9999px',
        width: '1px',
        height: '1px',
        opacity: 0,
        pointerEvents: 'none',
        tabIndex: -1
      }
    }
  }

  static isBot(honeypotValue: string): boolean {
    return honeypotValue.trim().length > 0
  }
}
