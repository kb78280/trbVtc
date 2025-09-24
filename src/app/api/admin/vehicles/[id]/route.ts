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

// PUT - Modifier un véhicule
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

    const { nom, plaque_immatriculation, capacite_places, capacite_bagages } = await request.json()
    const vehicleId = params.id

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
        'UPDATE vehicles SET nom = ?, plaque_immatriculation = ?, capacite_places = ?, capacite_bagages = ? WHERE id = ?',
        [nom, plaque_immatriculation, capacite_places, capacite_bagages, vehicleId]
      )

      const updateResult = result as any
      
      if (updateResult.affectedRows === 0) {
        return NextResponse.json(
          { message: 'Véhicule non trouvé' },
          { status: 404 }
        )
      }

      // Récupérer le véhicule modifié
      const [rows] = await connection.execute(
        'SELECT * FROM vehicles WHERE id = ?',
        [vehicleId]
      )

      return NextResponse.json((rows as any[])[0])

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
    console.error('Erreur lors de la modification du véhicule:', error)
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un véhicule
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

    const vehicleId = params.id
    const pool = getPool()
    const connection = await pool.getConnection()
    
    try {
      // Vérifier si le véhicule existe
      const [checkRows] = await connection.execute(
        'SELECT id FROM vehicles WHERE id = ?',
        [vehicleId]
      )

      if ((checkRows as any[]).length === 0) {
        return NextResponse.json(
          { message: 'Véhicule non trouvé' },
          { status: 404 }
        )
      }

      // Supprimer le véhicule (les prix associés seront supprimés automatiquement via CASCADE)
      await connection.execute(
        'DELETE FROM vehicles WHERE id = ?',
        [vehicleId]
      )

      return NextResponse.json({ message: 'Véhicule supprimé avec succès' })

    } finally {
      connection.release()
    }

  } catch (error) {
    console.error('Erreur lors de la suppression du véhicule:', error)
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}