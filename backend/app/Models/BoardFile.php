<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class BoardFile extends Model {
 protected $fillable = ['board_id','user_id','original_name','path','mime_type','size'];
 protected $hidden = ['path'];
 public function board() { return $this->belongsTo(Board::class); }
 public function uploader() { return $this->belongsTo(User::class, 'user_id'); }
}
