<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('boards', function (Blueprint $table) {
            $table->string('invite_code', 20)
                ->nullable()
                ->unique()
                ->after('cover_image');
        });
    }

    public function down(): void
    {
        Schema::table('boards', function (Blueprint $table) {
            $table->dropUnique(['invite_code']);
            $table->dropColumn('invite_code');
        });
    }
};