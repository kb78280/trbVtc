import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { getPool } from '@/lib/database'

// Middleware pour vérifier l'authentification admin
async function verifyAdmin(request: Request) {
  const authHeader = request.headers.get('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
  } catch {
    return null
  }
}

// GET - Récupérer tous les véhicules
export async function GET(request: Request) {
  try {
    const user = await verifyAdmin(request)
    if (!user) {
      return NextResponse.json(
        { message: 'Accès non autorisé' },
        { status: 401 }
      )
    }

    const pool = getPool()
    const connection = await pool.getConnection()
    
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM vehicles ORDER BY created_at DESC'
      )
      return NextResponse.json(rows)
    } finally {
      connection.release()
    }

  } catch (error) {
    console.error('Erreur lors de la récupération des véhicules:', error)
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// POST - Créer un nouveau véhicule
export async function POST(request: Request) {
  try {
    const user = await verifyAdmin(request)
    if (!user) {
      return NextResponse.json(
        { message: 'Accès non autorisé' },
        { status: 401 }
      )
    }

    const { nom, plaque_immatriculation, capacite_places, capacite_bagages } = await request.json()

    if (!nom || !plaque_immatriculation || !capacite_places || !capacite_bagages) {
      return NextResponse.json(
        { message: 'Tous les champs sont requis' },
        { status: 400 }
      )
    }

    const pool = getPool()
    const connection = await pool.getConnection()
    
    try {
      const [result] = await connection.execute(
        'INSERT INTO vehicles (nom, plaque_immatriculation, capacite_places, capacite_bagages) VALUES (?, ?, ?, ?)',
        [nom, plaque_immatriculation, capacite_places, capacite_bagages]
      )

      const insertResult = result as any
      
      // Récupérer le véhicule créé
      const [rows] = await connection.execute(
        'SELECT * FROM vehicles WHERE id = ?',
        [insertResult.insertId]
      )

      return NextResponse.json((rows as any[])[0], { status: 201 })

    } catch (dbError: any) {
      
      if (dbError.code === 'ER_DUP_ENTRY') {
        return NextResponse.json(
          { message: 'Cette plaque d\'immatriculation existe déjà' },
          { status: 409 }
        )
      }
      
      throw dbError
    } finally {
      connection.release()
    }

  } catch (error) {
    console.error('Erreur lors de la création du véhicule:', error)
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
