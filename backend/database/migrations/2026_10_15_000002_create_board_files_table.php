<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void { Schema::create('board_files', function (Blueprint $table) { $table->id(); $table->foreignId('board_id')->constrained()->cascadeOnDelete(); $table->foreignId('user_id')->constrained('users')->cascadeOnDelete(); $table->string('original_name'); $table->string('path'); $table->string('mime_type', 150)->nullable(); $table->unsignedBigInteger('size')->default(0); $table->timestamps(); $table->index(['board_id', 'created_at']); }); }
    public function down(): void { Schema::dropIfExists('board_files'); }
};
