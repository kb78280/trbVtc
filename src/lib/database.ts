import mysql from 'mysql2/promise'

// Configuration de la base de données
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'trbvtc',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}

// Pool de connexions
let pool: mysql.Pool | null = null

// Fonction pour obtenir le pool de connexions
export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool(dbConfig)
    console.log('🔗 [DATABASE] Pool de connexions MySQL créé')
  }
  return pool
}

// Fonction pour exécuter une requête
export async function executeQuery<T = unknown>(
  query: string, 
  params: unknown[] = []
): Promise<T[]> {
  try {
    const pool = getPool()
    const [rows] = await pool.execute(query, params)
    return rows as T[]
  } catch (error) {
    console.error('❌ [DATABASE] Erreur lors de l\'exécution de la requête:', error)
    console.error('📝 [DATABASE] Requête:', query)
    console.error('🔧 [DATABASE] Paramètres:', params)
    throw error
  }
}

// Fonction pour insérer une réservation complète (transaction) - Structure mise à jour
export async function insertReservation(data: {
  // Réservation principale (structure simplifiée)
  service_type: string
  vehicle_type: string
  departure_address: string
  arrival_address: string
  duration_hours?: number | null
  reservation_date: string
  reservation_time: string
  passenger_count: number
  baggage_count: number
  payment_method: string
  comments?: string | null
  estimated_price: number
  distance_km?: number | null
  
  // Informations client
  first_name: string
  last_name: string
  phone: string
  email: string
  
  // Options
  child_seat_quantity?: number
  flower_bouquet?: boolean
  airport_assistance?: boolean
  
  // Prix (optionnel)
  base_price?: number | null
  total_ht?: number | null
  tva_amount?: number | null
  stripe_fees?: number | null
  total_ttc?: number | null
  
  // Étapes (simplifiées)
  waypoints?: Array<{
    waypoint_order: number
    address: string
  }>
}) {
  const pool = getPool()
  const connection = await pool.getConnection()
  
  try {
    await connection.beginTransaction()
    console.log('🔄 [DATABASE] Début de la transaction')
    
    // 1. Insérer la réservation principale (structure mise à jour)
    const [reservationResult] = await connection.execute(`
      INSERT INTO vtc_reservations (
        service_type, vehicle_type, departure_address, arrival_address,
        duration_hours, reservation_date, reservation_time,
        passenger_count, baggage_count, payment_method, comments, estimated_price, distance_km
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.service_type, data.vehicle_type, data.departure_address, data.arrival_address,
      data.duration_hours, data.reservation_date, data.reservation_time,
      data.passenger_count, data.baggage_count, data.payment_method, data.comments, data.estimated_price, data.distance_km
    ])
    
    const reservationId = (reservationResult as { insertId: number }).insertId
    console.log('✅ [DATABASE] Réservation insérée avec ID:', reservationId)
    
    // 2. Insérer les informations client
    await connection.execute(`
      INSERT INTO vtc_customer_info (reservation_id, first_name, last_name, phone, email)
      VALUES (?, ?, ?, ?, ?)
    `, [reservationId, data.first_name, data.last_name, data.phone, data.email])
    console.log('✅ [DATABASE] Informations client insérées')
    
    // 3. Insérer les options
    await connection.execute(`
      INSERT INTO vtc_reservation_options (reservation_id, child_seat_quantity, flower_bouquet, airport_assistance)
      VALUES (?, ?, ?, ?)
    `, [
      reservationId, 
      data.child_seat_quantity || 0, 
      data.flower_bouquet || false, 
      data.airport_assistance || false
    ])
    console.log('✅ [DATABASE] Options insérées')
    
    // 4. Note: Les informations de route sont maintenant dans vtc_reservations.distance_km
    // Plus besoin d'insérer dans vtc_route_info (table supprimée)
    
    // 5. Insérer les informations de prix (structure simplifiée)
    if (data.total_ttc) {
      await connection.execute(`
        INSERT INTO vtc_pricing_info (reservation_id, base_price, total_ht, tva_amount, stripe_fees, total_ttc)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        reservationId,
        data.base_price || 0,
        data.total_ht || 0,
        data.tva_amount || 0,
        data.stripe_fees || 0,
        data.total_ttc
      ])
      console.log('✅ [DATABASE] Informations de prix insérées')
    }
    
    // 6. Insérer les étapes (structure simplifiée)
    if (data.waypoints && data.waypoints.length > 0) {
      for (const waypoint of data.waypoints) {
        await connection.execute(`
          INSERT INTO vtc_waypoints (reservation_id, waypoint_order, address)
          VALUES (?, ?, ?)
        `, [
          reservationId,
          waypoint.waypoint_order,
          waypoint.address
        ])
      }
      console.log('✅ [DATABASE] Étapes insérées:', data.waypoints.length)
    }
    
    await connection.commit()
    console.log('🎉 [DATABASE] Transaction terminée avec succès')
    
    return reservationId
    
  } catch (error) {
    await connection.rollback()
    console.error('❌ [DATABASE] Erreur lors de la transaction, rollback effectué')
    throw error
  } finally {
    connection.release()
  }
}

// Fonction pour récupérer une réservation complète
export async function getReservationComplete(reservationId: number) {
  try {
    const [rows] = await executeQuery(
      'SELECT * FROM vtc_reservations WHERE id = ?',
      [reservationId]
    )
    return (rows as unknown[])[0] || null
  } catch (error) {
    console.error('❌ [DATABASE] Erreur lors de la récupération de la réservation:', error)
    throw error
  }
}

// Fonction pour tester la connexion
export async function testConnection() {
  try {
    const pool = getPool()
    const connection = await pool.getConnection()
    await connection.ping()
    connection.release()
    console.log('✅ [DATABASE] Connexion MySQL réussie')
    return true
  } catch (error) {
    console.error('❌ [DATABASE] Erreur de connexion MySQL:', error)
    return false
  }
}
