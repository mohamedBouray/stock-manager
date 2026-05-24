<?php
// app/Helpers/NotificationHelper.php

namespace App\Helpers;

use App\Models\Notification;
use App\Models\User;

class NotificationHelper
{
    public static function send($userId, $type, $title, $message, $data = [])
    {
        return Notification::create([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data
        ]);
    }
    
    public static function sendToAdmins($type, $title, $message, $data = [])
    {
        $admins = User::where('role', 'admin')->get();
        foreach ($admins as $admin) {
            self::send($admin->id, $type, $title, $message, $data);
        }
    }
    
    public static function sendToMagasiniers($type, $title, $message, $data = [])
    {
        $magasiniers = User::where('role', 'magasinier')->get();
        foreach ($magasiniers as $magasinier) {
            self::send($magasinier->id, $type, $title, $message, $data);
        }
    }
}