<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BoardNotification extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = [
        'recipient_id', 'actor_id', 'board_id', 'type',
        'task_id', 'task_title', 'data', 'read_at', 'emailed_at',
    ];

    protected $casts = [
        'data'       => 'array',
        'read_at'    => 'datetime',
        'emailed_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    public function actor()
    {
        return $this->belongsTo(User::class, 'actor_id');
    }

    public function recipient()
    {
        return $this->belongsTo(User::class, 'recipient_id');
    }

    public function board()
    {
        return $this->belongsTo(Board::class);
    }
}
