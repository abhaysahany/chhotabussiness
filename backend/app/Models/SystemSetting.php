<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    use HasFactory;

    protected $table = 'system_settings';

    protected $fillable = [
        'key',
        'value',
        'group',
    ];

    public static function get($key, $default = null)
    {
        $setting = static::where('key', $key)->first();
        if (!$setting) return $default;
        $decoded = json_decode($setting->value, true);
        return json_last_error() === JSON_ERROR_NONE ? $decoded : $setting->value;
    }

    public static function set($key, $value, $group = 'general')
    {
        $val = is_array($value) || is_object($value) ? json_encode($value) : (string)$value;
        return static::updateOrCreate(
            ['key' => $key],
            ['value' => $val, 'group' => $group]
        );
    }
}
