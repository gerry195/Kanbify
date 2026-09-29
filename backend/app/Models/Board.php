<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Board extends Model
{
    use HasFactory;

    protected $fillable = ['owner_id', 'name', 'category', 'cover_image'];

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function members()
    {
        return $this->belongsToMany(User::class, 'board_members')
            ->withPivot('role', 'is_starred')
            ->withTimestamps();
    }

    public function boardMembers()
    {
        return $this->hasMany(BoardMember::class);
    }

    public function tasks()
    {
        return $this->hasMany(Task::class);
    }

    /** Role of a given user on this board, or null if not a member. */
    public function roleOf(User $user): ?string
    {
        $membership = $this->boardMembers->firstWhere('user_id', $user->id);
        return $membership?->role;
    }
}
