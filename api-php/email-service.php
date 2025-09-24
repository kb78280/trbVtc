<?php
/**
 * Service d'envoi d'emails pour les réservations VTC
 */

require_once 'config.php';

class EmailService {
    
    private $from_email = 'noreply@vtc-transport-conciergerie.fr';
    private $from_name = 'TRB Transport';
    private $admin_email = 'contact@vtc-transport-conciergerie.fr';
    
    /**
     * Envoyer un email de confirmation de réservation au client
     */
    public function sendReservationConfirmation($reservationData) {
        try {
            $to = $reservationData['email'];
            $subject = "✅ Confirmation de votre réservation VTC - TRB Transport";
            
            $message = $this->getConfirmationEmailTemplate($reservationData);
            
            $headers = $this->getEmailHeaders();
            
            $sent = mail($to, $subject, $message, $headers);
            
            if ($sent) {
                logError("Email de confirmation envoyé", ['email' => $to, 'reservation_id' => $reservationData['reservation_id']]);
                return true;
            } else {
                logError("Échec envoi email", ['email' => $to, 'reservation_id' => $reservationData['reservation_id']]);
                return false;
            }
            
        } catch (Exception $e) {
            logError("Erreur envoi email", ['error' => $e->getMessage(), 'email' => $to ?? 'unknown']);
            return false;
        }
    }
    
    /**
     * Envoyer une notification à l'admin
     */
    public function sendAdminNotification($reservationData) {
        try {
            $subject = "🚗 Nouvelle réservation VTC - " . $reservationData['prenom'] . " " . $reservationData['nom'];
            
            $message = $this->getAdminNotificationTemplate($reservationData);
            
            $headers = $this->getEmailHeaders();
            
            $sent = mail($this->admin_email, $subject, $message, $headers);
            
            if ($sent) {
                logError("Notification admin envoyée", ['reservation_id' => $reservationData['reservation_id']]);
                return true;
            }
            
            return false;
            
        } catch (Exception $e) {
            logError("Erreur notification admin", ['error' => $e->getMessage()]);
            return false;
        }
    }
    
    /**
     * Template email client
     */
    private function getConfirmationEmailTemplate($data) {
        $serviceTypeLabel = $data['serviceType'] === 'transfert' ? 'Transfert' : 'Mise à disposition';
        $vehicleTypeLabel = $data['vehicleType'] === 'berline' ? 'Berline' : 'Van';
        $paymentMethodLabel = $data['methodePaiement'] === 'immediate' ? 'Paiement immédiat' : 'Paiement sur place';
        
        $html = "
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .reservation-details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .detail-row { display: flex; justify-content: space-between; margin: 8px 0; padding: 5px 0; border-bottom: 1px solid #eee; }
        .label { font-weight: bold; color: #555; }
        .value { color: #333; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>🎉 Réservation Confirmée !</h1>
            <p>Merci pour votre confiance, {$data['prenom']} !</p>
        </div>
        
        <div class='content'>
            <p>Bonjour <strong>{$data['prenom']} {$data['nom']}</strong>,</p>
            
            <p>Votre réservation a été <strong>confirmée avec succès</strong>. Voici le récapitulatif :</p>
            
            <div class='reservation-details'>
                <h3>📋 Détails de votre réservation</h3>
                
                <div class='detail-row'>
                    <span class='label'>🆔 Numéro de réservation :</span>
                    <span class='value'>#{$data['reservation_id']}</span>
                </div>
                
                <div class='detail-row'>
                    <span class='label'>🚗 Service :</span>
                    <span class='value'>{$serviceTypeLabel}</span>
                </div>
                
                <div class='detail-row'>
                    <span class='label'>🚙 Véhicule :</span>
                    <span class='value'>{$vehicleTypeLabel}</span>
                </div>
                
                <div class='detail-row'>
                    <span class='label'>📍 Départ :</span>
                    <span class='value'>{$data['depart']}</span>
                </div>
                
                <div class='detail-row'>
                    <span class='label'>🎯 Arrivée :</span>
                    <span class='value'>{$data['arrivee']}</span>
                </div>
                
                <div class='detail-row'>
                    <span class='label'>📅 Date :</span>
                    <span class='value'>{$data['dateReservation']}</span>
                </div>
                
                <div class='detail-row'>
                    <span class='label'>🕐 Heure :</span>
                    <span class='value'>{$data['heureReservation']}</span>
                </div>
                
                <div class='detail-row'>
                    <span class='label'>👥 Passagers :</span>
                    <span class='value'>{$data['nombrePassagers']}</span>
                </div>
                
                <div class='detail-row'>
                    <span class='label'>🧳 Bagages :</span>
                    <span class='value'>{$data['nombreBagages']}</span>
                </div>
                
                <div class='detail-row'>
                    <span class='label'>💳 Paiement :</span>
                    <span class='value'>{$paymentMethodLabel}</span>
                </div>
            </div>
            
            <div style='background: #EBF8FF; padding: 15px; border-radius: 8px; margin: 20px 0;'>
                <h4>📞 Informations importantes :</h4>
                <ul>
                    <li><strong>Votre chauffeur vous contactera</strong> 15 minutes avant l'heure de prise en charge</li>
                    <li><strong>Numéro de réservation :</strong> #{$data['reservation_id']} (à conserver)</li>
                    <li><strong>Modifications :</strong> Contactez-nous au 07 85 65 84 63</li>
                    <li><strong>Annulation :</strong> Gratuite jusqu'à 2h avant le départ</li>
                </ul>
            </div>
            
            <p>En cas de question, n'hésitez pas à nous contacter :</p>
            <p>
                📞 <strong>07 85 65 84 63</strong><br>
                ✉️ <strong>contact@vtc-transport-conciergerie.fr</strong>
            </p>
            
            <p>Merci de votre confiance et à bientôt !</p>
            <p><strong>L'équipe TRB Transport</strong></p>
        </div>
        
        <div class='footer'>
            <p>TRB Transport - Service VTC Premium à Paris et région parisienne</p>
            <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
        </div>
    </div>
</body>
</html>";

        return $html;
    }
    
    /**
     * Template notification admin
     */
    private function getAdminNotificationTemplate($data) {
        $serviceTypeLabel = $data['serviceType'] === 'transfert' ? 'Transfert' : 'Mise à disposition';
        $vehicleTypeLabel = $data['vehicleType'] === 'berline' ? 'Berline' : 'Van';
        
        return "
🚗 NOUVELLE RÉSERVATION VTC

📋 Détails :
- ID: #{$data['reservation_id']}
- Client: {$data['prenom']} {$data['nom']}
- Email: {$data['email']}
- Téléphone: {$data['telephone']}

🎯 Trajet :
- Service: {$serviceTypeLabel}
- Véhicule: {$vehicleTypeLabel}
- Départ: {$data['depart']}
- Arrivée: {$data['arrivee']}
- Date: {$data['dateReservation']} à {$data['heureReservation']}

👥 Détails :
- Passagers: {$data['nombrePassagers']}
- Bagages: {$data['nombreBagages']}
- Paiement: {$data['methodePaiement']}

💰 Prix estimé: {$data['estimatedPrice']}€

---
Connectez-vous à l'admin pour plus de détails.
        ";
    }
    
    /**
     * Headers email
     */
    private function getEmailHeaders() {
        return [
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=UTF-8',
            'From: ' . $this->from_name . ' <' . $this->from_email . '>',
            'Reply-To: ' . $this->admin_email,
            'X-Mailer: PHP/' . phpversion()
        ];
    }
}
?>

