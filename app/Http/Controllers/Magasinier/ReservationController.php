<?php

namespace App\Http\Controllers\Magasinier;

use App\Http\Controllers\Controller;
use App\Models\Admin\Reservation;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ReservationController extends Controller
{
    // Liste de toutes les réservations
    public function index(Request $request)
    {
        try {
            $query = Reservation::with(['user', 'article']);
            
            if ($request->statut && in_array($request->statut, ['en_attente', 'confirmee', 'annulee', 'expiree'])) {
                $query->where('statut', $request->statut);
            }
            
            $reservations = $query->orderBy('created_at', 'desc')->get();
            
            return response()->json([
                'success' => true,
                'data' => $reservations
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    // Confirmer une réservation
    public function confirmer($id)
    {
        try {
            $reservation = Reservation::findOrFail($id);
            
            if ($reservation->statut !== 'en_attente') {
                return response()->json([
                    'success' => false,
                    'message' => 'Cette réservation ne peut plus être confirmée'
                ], 422);
            }
            
            $reservation->update([
                'statut' => 'confirmee'
            ]);
            
            Notification::create([
                'user_id' => $reservation->user_id,
                'type' => 'reservation_confirmee',
                'title' => 'Réservation confirmée',
                'message' => 'Votre réservation pour ' . $reservation->article->designation . ' a été confirmée du ' . $reservation->date_debut . ' au ' . $reservation->date_fin,
                'data' => ['reservation_id' => $reservation->id, 'statut' => 'confirmee']
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Réservation confirmée avec succès'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    // Annuler une réservation
    public function annuler($id)
    {
        try {
            $reservation = Reservation::findOrFail($id);
            
            if (!in_array($reservation->statut, ['en_attente', 'confirmee'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cette réservation ne peut pas être annulée'
                ], 422);
            }
            
            $reservation->update([
                'statut' => 'annulee'
            ]);
            

            Notification::create([
                'user_id' => $reservation->user_id,
                'type' => 'reservation_annulee',
                'title' => ' Réservation annulée',
                'message' => 'Votre réservation pour ' . $reservation->article->designation . ' a été annulée par le magasinier.',
                'data' => ['reservation_id' => $reservation->id, 'statut' => 'annulee']
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Réservation annulée avec succès'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    // Voir une réservation spécifique
    public function show($id)
    {
        try {
            $reservation = Reservation::with(['user', 'article'])
                ->findOrFail($id);
            
            return response()->json([
                'success' => true,
                'data' => $reservation
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
}