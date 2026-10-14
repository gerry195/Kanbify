<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::table('boards', function (Blueprint $table) { $table->string('background', 30)->default('whiteboard'); $table->string('background_image')->nullable(); });
        Schema::table('tasks', function (Blueprint $table) { $table->date('start_date')->nullable()->after('is_running'); });
    }
    public function down(): void {
        Schema::table('tasks', function (Blueprint $table) { $table->dropColumn('start_date'); });
        Schema::table('boards', function (Blueprint $table) { $table->dropColumn(['background', 'background_image']); });
    }
};
