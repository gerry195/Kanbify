<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Email ringkasan aktivitas board, tiap 10 menit.
// Jalankan scheduler: `php artisan schedule:work` (dev) atau cron `* * * * * php artisan schedule:run` (server).
Illuminate\Support\Facades\Schedule::command('notifications:send-digest')
    ->everyTenMinutes()
    ->withoutOverlapping();
