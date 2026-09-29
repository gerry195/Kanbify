<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    use HasFactory;

    protected $fillable = [
        'board_id', 'user_id', 'title', 'description', 'status', 'priority',
        'color', 'time', 'is_running', 'due_date', 'completed_at',
    ];

    protected $casts = [
        'is_running'   => 'boolean',
        'due_date'     => 'date:Y-m-d',
        'completed_at' => 'datetime',
    ];

    public function board()
    {
        return $this->belongsTo(Board::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
