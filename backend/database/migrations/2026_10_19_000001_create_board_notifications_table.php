<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Nama tabel dibuat berbeda dari "notifications" bawaan Laravel
        // supaya tidak bentrok dengan trait Notifiable di model User.
        Schema::create('board_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recipient_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('actor_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('board_id')->constrained('boards')->cascadeOnDelete();

            // task_status | task_updated | task_deleted
            $table->string('type', 30);

            // Tugas bisa dihapus, jadi id tidak memakai foreign key
            // dan judulnya disimpan di sini.
            $table->unsignedBigInteger('task_id')->nullable();
            $table->string('task_title');

            // status: {from, to}   updated: {fields: [...]}
            $table->json('data')->nullable();

            $table->timestamp('read_at')->nullable();
            $table->timestamp('emailed_at')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['recipient_id', 'created_at']);
            $table->index(['recipient_id', 'read_at']);
            $table->index(['emailed_at', 'recipient_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('board_notifications');
    }
};
