<?php

namespace App\Models\Admin;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $table = 'settings';
    
    protected $fillable = ['key', 'value', 'group'];

    public static function get(string $key, mixed $default = null): mixed
    {
        $setting = self::where('key', $key)->first();

        if (!$setting) {
            return $default;
        }

        $decoded = json_decode($setting->value, true);
        return ($decoded !== null || $setting->value === 'null') ? $decoded : $setting->value;
    }

    public static function set(string $key, mixed $value, string $group = 'general'): self
    {
        return self::updateOrCreate(
            ['key' => $key],
            [
                'value' => json_encode($value),
                'group' => $group,
            ]
        );
    }

    public static function getGroup(string $group): array
    {
        return self::where('group', $group)
            ->get()
            ->mapWithKeys(function ($setting) {
                $decoded = json_decode($setting->value, true);
                $value = ($decoded !== null || $setting->value === 'null') 
                    ? $decoded 
                    : $setting->value;
                return [$setting->key => $value];
            })
            ->toArray();
    }
}