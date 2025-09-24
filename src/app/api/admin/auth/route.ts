import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { getPool } from '@/lib/database'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { message: 'Nom d\'utilisateur et mot de passe requis' },
        { status: 400 }
      )
    }

    const pool = getPool()
    const connection = await pool.getConnection()
    
    try {
      // Vérifier les identifiants
      const [rows] = await connection.execute(
        'SELECT id, username, password_hash FROM admin_users WHERE username = ?',
        [username]
      )

      const users = rows as any[]
      
      if (users.length === 0) {
        return NextResponse.json(
          { message: 'Identifiants incorrects' },
          { status: 401 }
        )
      }

      const user = users[0]
      
      // Vérifier le mot de passe
      const passwordValid = await bcrypt.compare(password, user.password_hash)
      
      if (!passwordValid) {
        return NextResponse.json(
          { message: 'Identifiants incorrects' },
          { status: 401 }
        )
      }

      // Générer le token JWT
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      )

      return NextResponse.json({
        token,
        user: {
          id: user.id,
          username: user.username
        }
      })
    } finally {
      connection.release()
    }

  } catch (error) {
    console.error('Erreur d\'authentification:', error)
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
