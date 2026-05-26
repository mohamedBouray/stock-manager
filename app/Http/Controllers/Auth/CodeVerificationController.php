<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class CodeVerificationController extends Controller
{
    public function verify(Request $request)
    {
        $request->validate([
            'code' => 'required|numeric',
        ]);

        $user = $request->user();

        $record = DB::table('email_verification_codes')
            ->where('email', $user->email)
            ->where('code', $request->code)
            ->first();

        if (!$record) {
            return response()->json(['message' => 'Code incorrect'], 422);
        }

        if (now()->isAfter($record->expires_at)) {
            return response()->json(['message' => 'Code expiré'], 422);
        }

        $user->markEmailAsVerified();

        DB::table('email_verification_codes')->where('email', $user->email)->delete();

        return response()->json(['message' => 'Success', 'user' => $user], 200);
    }

    public function resend(Request $request)
    {
        $user = $request->user();
        $code = rand(100000, 999999);

        DB::table('email_verification_codes')->updateOrInsert(
            ['email' => $user->email],
            ['code' => $code, 'expires_at' => now()->addMinutes(15), 'created_at' => now()]
        );

        $user->notify(new \App\Notifications\SendVerificationCode($code));

        return response()->json(['message' => 'Code renvoyé avec succès'], 200);
    }
}