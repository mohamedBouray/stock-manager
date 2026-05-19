<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SettingsController extends Controller
{
    private function checkAdmin()
    {
        $user = auth()->user();
        if (!$user || $user->role !== 'admin') {
            abort(403, 'Accès non autorisé');
        }
    }

    public function general()
    {
        try {
            $this->checkAdmin();
            
            $settings = [
                'app_name' => Setting::get('app_name', 'ISTAHT Stock Manager'),
                'app_logo' => Setting::get('app_logo', null),
                'app_favicon' => Setting::get('app_favicon', null),
                'primary_color' => Setting::get('primary_color', '#006233'),
                'secondary_color' => Setting::get('secondary_color', '#C0392B'),
                'date_format' => Setting::get('date_format', 'd/m/Y'),
                'timezone' => Setting::get('timezone', 'Africa/Casablanca'),
                'language' => Setting::get('language', 'fr'),
            ];
            
            return response()->json($settings);
        } catch (\Exception $e) {
            Log::error('Error in general settings: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur: ' . $e->getMessage()], 500);
        }
    }
    
    public function stock()
    {
        try {
            $this->checkAdmin();
            
            $settings = [
                'low_stock_threshold' => Setting::get('low_stock_threshold', 10),
                'critical_stock_threshold' => Setting::get('critical_stock_threshold', 5),
                'auto_generate_orders' => Setting::get('auto_generate_orders', false),
                'enable_barcode' => Setting::get('enable_barcode', true),
                'enable_serial_numbers' => Setting::get('enable_serial_numbers', false),
                'default_warehouse' => Setting::get('default_warehouse', null),
                'stock_alert_email' => Setting::get('stock_alert_email', null),
            ];
            
            return response()->json($settings);
        } catch (\Exception $e) {
            Log::error('Error in stock settings: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur: ' . $e->getMessage()], 500);
        }
    }
    
    public function notifications()
    {
        try {
            $this->checkAdmin();
            
            $settings = [
                'email_notifications' => Setting::get('email_notifications', true),
                'stock_alert_notification' => Setting::get('stock_alert_notification', true),
                'order_status_notification' => Setting::get('order_status_notification', true),
                'low_stock_email' => Setting::get('low_stock_email', null),
                'critical_stock_email' => Setting::get('critical_stock_email', null),
                'notification_frequency' => Setting::get('notification_frequency', 'daily'),
            ];
            
            return response()->json($settings);
        } catch (\Exception $e) {
            Log::error('Error in notifications settings: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur: ' . $e->getMessage()], 500);
        }
    }
    
    public function backup()
    {
        try {
            $this->checkAdmin();
            
            $settings = [
                'auto_backup' => Setting::get('auto_backup', false),
                'backup_frequency' => Setting::get('backup_frequency', 'weekly'),
                'backup_time' => Setting::get('backup_time', '00:00'),
                'backup_retention_days' => Setting::get('backup_retention_days', 30),
                'backup_location' => Setting::get('backup_location', 'storage'),
            ];
            
            return response()->json($settings);
        } catch (\Exception $e) {
            Log::error('Error in backup settings: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur: ' . $e->getMessage()], 500);
        }
    }
    
    public function update(Request $request, $group)
    {
        try {
            $this->checkAdmin();
            
            $settings = $request->all();
            
            foreach ($settings as $key => $value) {
                Setting::set($key, $value, $group);
            }
            
            return response()->json([
                'message' => 'Paramètres mis à jour avec succès',
                'settings' => $settings
            ]);
        } catch (\Exception $e) {
            Log::error('Error in update settings: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur: ' . $e->getMessage()], 500);
        }
    }
    
    public function reset($group)
    {
        try {
            $this->checkAdmin();
            
            $defaults = $this->getDefaults($group);
            
            foreach ($defaults as $key => $value) {
                Setting::set($key, $value, $group);
            }
            
            return response()->json([
                'message' => 'Paramètres réinitialisés avec succès',
                'settings' => $defaults
            ]);
        } catch (\Exception $e) {
            Log::error('Error in reset settings: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur: ' . $e->getMessage()], 500);
        }
    }
    
    private function getDefaults($group)
    {
        $defaults = [
            'general' => [
                'app_name' => 'ISTAHT Stock Manager',
                'primary_color' => '#006233',
                'secondary_color' => '#C0392B',
                'date_format' => 'd/m/Y',
                'timezone' => 'Africa/Casablanca',
                'language' => 'fr',
            ],
            'stock' => [
                'low_stock_threshold' => 10,
                'critical_stock_threshold' => 5,
                'enable_barcode' => true,
            ],
            'notifications' => [
                'email_notifications' => true,
                'stock_alert_notification' => true,
            ],
            'backup' => [
                'auto_backup' => false,
                'backup_frequency' => 'weekly',
                'backup_retention_days' => 30,
            ],
        ];
        
        return $defaults[$group] ?? [];
    }
}