<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Admin\Demande;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MessageController extends Controller
{
    public function getConversation($demandeId)
    {
        $demande = Demande::findOrFail($demandeId);
        
        $conversation = Conversation::firstOrCreate(
            ['demande_id' => $demandeId],
            [
                'user_id' => $demande->user_id,
                'magasinier_id' => auth()->user()->role === 'magasinier' ? auth()->id() : null
            ]
        );
        
        $messages = Message::where('conversation_id', $conversation->id)
            ->with('user')
            ->orderBy('created_at', 'asc')
            ->get();
        
        return response()->json([
            'conversation' => $conversation,
            'messages' => $messages
        ]);
    }
    
    public function sendMessage(Request $request, $demandeId)
    {
        $request->validate(['message' => 'required|string|max:1000']);
        
        $conversation = Conversation::firstOrCreate(
            ['demande_id' => $demandeId],
            [
                'user_id' => Auth::id(),
                'magasinier_id' => null
            ]
        );
        
        $message = Message::create([
            'conversation_id' => $conversation->id,
            'user_id' => Auth::id(),
            'message' => $request->message,
            'is_read' => false
        ]);
        
        return response()->json($message->load('user'), 201);
    }
}