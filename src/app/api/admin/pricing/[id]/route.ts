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

// PUT - Modifier un tarif
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAdmin(request)
    if (!user) {
      return NextResponse.json(
        { message: 'Accès non autorisé' },
        { status: 401 }
      )
    }

    const { vehicle_id, prix_km, tarif_base, tva } = await request.json()
    const pricingId = params.id

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

      // Modifier le tarif
      const [result] = await connection.execute(
        'UPDATE vehicle_pricing SET vehicle_id = ?, prix_km = ?, tarif_base = ?, tva = ? WHERE id = ?',
        [vehicle_id, prix_km, tarif_base, tva, pricingId]
      )

      const updateResult = result /* eslint-disable-next-line @typescript-eslint/no-explicit-any */ as any
      
      if (updateResult.affectedRows === 0) {
        return NextResponse.json(
          { message: 'Tarif non trouvé' },
          { status: 404 }
        )
      }

      // Récupérer le tarif modifié avec les infos véhicule
      const [rows] = await connection.execute(`
        SELECT 
          vp.*,
          v.nom as vehicle_nom,
          v.plaque_immatriculation as vehicle_plaque
        FROM vehicle_pricing vp
        LEFT JOIN vehicles v ON vp.vehicle_id = v.id
        WHERE vp.id = ?
      `, [pricingId])

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

      return NextResponse.json(response)

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
    console.error('Erreur lors de la modification du tarif:', error)
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un tarif
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAdmin(request)
    if (!user) {
      return NextResponse.json(
        { message: 'Accès non autorisé' },
        { status: 401 }
      )
    }

    const pricingId = params.id
    const pool = getPool()
    const connection = await pool.getConnection()
    
    try {
      // Vérifier si le tarif existe
      const [checkRows] = await connection.execute(
        'SELECT id FROM vehicle_pricing WHERE id = ?',
        [pricingId]
      )

      if ((checkRows /* eslint-disable-next-line @typescript-eslint/no-explicit-any */ as any[]).length === 0) {
        return NextResponse.json(
          { message: 'Tarif non trouvé' },
          { status: 404 }
        )
      }

      // Supprimer le tarif
      await connection.execute(
        'DELETE FROM vehicle_pricing WHERE id = ?',
        [pricingId]
      )

      return NextResponse.json({ message: 'Tarif supprimé avec succès' })

    } finally {
      connection.release()
    }

  } catch (error) {
    console.error('Erreur lors de la suppression du tarif:', error)
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}