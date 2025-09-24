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

// GET - Récupérer tous les prix avec les informations des véhicules
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
      const [rows] = await connection.execute(`
        SELECT 
          vp.*,
          v.nom as vehicle_nom,
          v.plaque_immatriculation as vehicle_plaque
        FROM vehicle_pricing vp
        LEFT JOIN vehicles v ON vp.vehicle_id = v.id
        ORDER BY vp.created_at DESC
      `)

      // Restructurer les données pour inclure les infos véhicule
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pricings = (rows /* eslint-disable-next-line @typescript-eslint/no-explicit-any */ as any[]).map(row => ({
        id: row.id,
        vehicle_id: row.vehicle_id,
        prix_km: row.prix_km,
        tarif_base: row.tarif_base,
        tva: row.tva,
        created_at: row.created_at,
        updated_at: row.updated_at,
        vehicle: {
          nom: row.vehicle_nom,
          plaque_immatriculation: row.vehicle_plaque
        }
      }))

      return NextResponse.json(pricings)
    } finally {
      connection.release()
    }


  } catch (error) {
    console.error('Erreur lors de la récupération des prix:', error)
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// POST - Créer un nouveau tarif
export async function POST(request: Request) {
  try {
    const user = await verifyAdmin(request)
    if (!user) {
      return NextResponse.json(
        { message: 'Accès non autorisé' },
        { status: 401 }
      )
    }

    const { vehicle_id, prix_km, tarif_base, tva } = await request.json()

    if (!vehicle_id || prix_km === undefined || tarif_base === undefined || tva === undefined) {
      return NextResponse.json(
        { message: 'Tous les champs sont requis' },
        { status: 400 }
      )
    }

    const pool = getPool()
    const connection = await pool.getConnection()
    
    try {
      // Vérifier que le véhicule existe
      const [vehicleRows] = await connection.execute(
        'SELECT id FROM vehicles WHERE id = ?',
        [vehicle_id]
      )

      if ((vehicleRows /* eslint-disable-next-line @typescript-eslint/no-explicit-any */ as any[]).length === 0) {
        return NextResponse.json(
          { message: 'Véhicule non trouvé' },
          { status: 404 }
        )
      }

      // Créer le tarif
      const [result] = await connection.execute(
        'INSERT INTO vehicle_pricing (vehicle_id, prix_km, tarif_base, tva) VALUES (?, ?, ?, ?)',
        [vehicle_id, prix_km, tarif_base, tva]
      )

      const insertResult = result /* eslint-disable-next-line @typescript-eslint/no-explicit-any */ as any
      
      // Récupérer le tarif créé avec les infos véhicule
      const [rows] = await connection.execute(`
        SELECT 
          vp.*,
          v.nom as vehicle_nom,
          v.plaque_immatriculation as vehicle_plaque
        FROM vehicle_pricing vp
        LEFT JOIN vehicles v ON vp.vehicle_id = v.id
        WHERE vp.id = ?
      `, [insertResult.insertId])

      const pricing = (rows /* eslint-disable-next-line @typescript-eslint/no-explicit-any */ as any[])[0]
      const response = {
        id: pricing.id,
        vehicle_id: pricing.vehicle_id,
        prix_km: pricing.prix_km,
        tarif_base: pricing.tarif_base,
        tva: pricing.tva,
        created_at: pricing.created_at,
        updated_at: pricing.updated_at,
        vehicle: {
          nom: pricing.vehicle_nom,
          plaque_immatriculation: pricing.vehicle_plaque
        }
      }

      return NextResponse.json(response, { status: 201 })

    } catch (dbError: any) {
      
      if (dbError.code === 'ER_DUP_ENTRY') {
        return NextResponse.json(
          { message: 'Ce véhicule a déjà un tarif configuré' },
          { status: 409 }
        )
      }
      
      throw dbError
    } finally {
      connection.release()
    }

  } catch (error) {
    console.error('Erreur lors de la création du tarif:', error)
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
