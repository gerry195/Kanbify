<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'username', 'email', 'password', 'fullname', 'avatar',
    ];

    protected $hidden = [
        'password', 'remember_token',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function ownedBoards()
    {
        return $this->hasMany(Board::class, 'owner_id');
    }

    public function boards()
    {
        return $this->belongsToMany(Board::class, 'board_members')
            ->withPivot('role', 'is_starred')
            ->withTimestamps();
    }

    public function boardMemberships()
    {
        return $this->hasMany(BoardMember::class);
    }
}
