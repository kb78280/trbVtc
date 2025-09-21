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
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
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
export async function executeQuery<T = any>(
  query: string, 
  params: any[] = []
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

// Fonction pour insérer une réservation complète (transaction)
export async function insertReservation(data: {
  // Réservation principale
  service_type: string
  vehicle_type: string
  departure_address: string
  arrival_address: string
  departure_place_id?: string | null
  arrival_place_id?: string | null
  departure_lat?: number | null
  departure_lng?: number | null
  arrival_lat?: number | null
  arrival_lng?: number | null
  duration_hours?: number | null
  reservation_date: string
  reservation_time: string
  passenger_count: number
  baggage_count: number
  payment_method: string
  comments?: string | null
  estimated_price: number
  
  // Informations client
  first_name: string
  last_name: string
  phone: string
  email: string
  
  // Options
  child_seat_quantity?: number
  flower_bouquet?: boolean
  airport_assistance?: boolean
  
  // Route (optionnel)
  route_distance?: string | null
  route_duration?: string | null
  route_distance_value?: number | null
  route_duration_value?: number | null
  
  // Prix (optionnel)
  base_price?: number | null
  total_ht?: number | null
  tva_amount?: number | null
  stripe_fees?: number | null
  total_ttc?: number | null
  distance_km?: number | null
  duration_minutes?: number | null
  
  // Étapes (optionnel)
  waypoints?: Array<{
    waypoint_order: number
    address: string
    place_id?: string | null
    latitude?: number | null
    longitude?: number | null
  }>
}) {
  const pool = getPool()
  const connection = await pool.getConnection()
  
  try {
    await connection.beginTransaction()
    console.log('🔄 [DATABASE] Début de la transaction')
    
    // 1. Insérer la réservation principale
    const [reservationResult] = await connection.execute(`
      INSERT INTO reservations (
        service_type, vehicle_type, departure_address, arrival_address,
        departure_place_id, arrival_place_id, departure_lat, departure_lng,
        arrival_lat, arrival_lng, duration_hours, reservation_date, reservation_time,
        passenger_count, baggage_count, payment_method, comments, estimated_price
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.service_type, data.vehicle_type, data.departure_address, data.arrival_address,
      data.departure_place_id, data.arrival_place_id, data.departure_lat, data.departure_lng,
      data.arrival_lat, data.arrival_lng, data.duration_hours, data.reservation_date, data.reservation_time,
      data.passenger_count, data.baggage_count, data.payment_method, data.comments, data.estimated_price
    ])
    
    const reservationId = (reservationResult as any).insertId
    console.log('✅ [DATABASE] Réservation insérée avec ID:', reservationId)
    
    // 2. Insérer les informations client
    await connection.execute(`
      INSERT INTO customer_info (reservation_id, first_name, last_name, phone, email)
      VALUES (?, ?, ?, ?, ?)
    `, [reservationId, data.first_name, data.last_name, data.phone, data.email])
    console.log('✅ [DATABASE] Informations client insérées')
    
    // 3. Insérer les options
    await connection.execute(`
      INSERT INTO reservation_options (reservation_id, child_seat_quantity, flower_bouquet, airport_assistance)
      VALUES (?, ?, ?, ?)
    `, [
      reservationId, 
      data.child_seat_quantity || 0, 
      data.flower_bouquet || false, 
      data.airport_assistance || false
    ])
    console.log('✅ [DATABASE] Options insérées')
    
    // 4. Insérer les informations de route (si disponibles)
    if (data.route_distance && data.route_duration) {
      await connection.execute(`
        INSERT INTO route_info (reservation_id, distance, duration, distance_value, duration_value)
        VALUES (?, ?, ?, ?, ?)
      `, [
        reservationId, 
        data.route_distance, 
        data.route_duration, 
        data.route_distance_value || null, 
        data.route_duration_value || null
      ])
      console.log('✅ [DATABASE] Informations de route insérées')
    }
    
    // 5. Insérer les informations de prix (si disponibles)
    if (data.total_ttc) {
      await connection.execute(`
        INSERT INTO pricing_info (reservation_id, base_price, total_ht, tva_amount, stripe_fees, total_ttc, distance_km, duration_minutes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        reservationId,
        data.base_price || 0,
        data.total_ht || 0,
        data.tva_amount || 0,
        data.stripe_fees || 0,
        data.total_ttc,
        data.distance_km || null,
        data.duration_minutes || null
      ])
      console.log('✅ [DATABASE] Informations de prix insérées')
    }
    
    // 6. Insérer les étapes (si disponibles)
    if (data.waypoints && data.waypoints.length > 0) {
      for (const waypoint of data.waypoints) {
        await connection.execute(`
          INSERT INTO waypoints (reservation_id, waypoint_order, address, place_id, latitude, longitude)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          reservationId,
          waypoint.waypoint_order,
          waypoint.address,
          waypoint.place_id || null,
          waypoint.latitude || null,
          waypoint.longitude || null
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
      'SELECT * FROM reservation_complete WHERE id = ?',
      [reservationId]
    )
    return rows[0] || null
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
