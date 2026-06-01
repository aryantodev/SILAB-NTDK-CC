<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Booking extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'tanggal_kirim' => 'date',
    ];

    // Ensure snake_case serialization for frontend
    protected $with = [];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function analysisItems()
    {
        return $this->hasMany(BookingAnalysisItem::class);
    }

    public function signature()
    {
        return $this->hasOne(\App\Models\Signature::class);
    }

    // Override toArray to ensure snake_case for relations
    public function toArray()
    {
        $array = parent::toArray();

        // Convert analysisItems to analysis_items if loaded
        if (isset($array['analysis_items'])) {
            // Already correct
        } elseif ($this->relationLoaded('analysisItems')) {
            $array['analysis_items'] = $this->analysisItems->toArray();
        }

        return $array;
    }
}
