<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BoardController;
use App\Http\Controllers\Api\BoardMemberController;
use App\Http\Controllers\Api\BoardFileController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\StatsController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

// ── Public ───────────────────────────────────────────────
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

// ── Protected (Sanctum bearer token) ────────────────────
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::put('/user/profile', [UserController::class, 'update']);
    Route::delete('/user/profile', [UserController::class, 'destroy']);

    Route::get('/boards', [BoardController::class, 'index']);
    Route::get('/calendar/tasks', [BoardController::class, 'calendarTasks']);
    Route::post('/boards', [BoardController::class, 'store']);
    Route::get('/boards/{board}', [BoardController::class, 'show']);
    Route::post('/boards/join', [BoardController::class, 'join']);
    Route::delete('/boards/{board}', [BoardController::class, 'destroy']);
    Route::put('/boards/{board}/star', [BoardController::class, 'toggleStar']);
    Route::post('/boards/{board}/appearance', [BoardController::class, 'updateAppearance']);
    Route::get('/boards/{board}/files', [BoardFileController::class, 'index']);
    Route::post('/boards/{board}/files', [BoardFileController::class, 'store']);
    Route::get('/boards/{board}/files/{fileId}/download', [BoardFileController::class, 'download']);
    Route::delete('/boards/{board}/files/{fileId}', [BoardFileController::class, 'destroy']);

    Route::get('/boards/{board}/members', [BoardMemberController::class, 'index']);
    Route::post('/boards/{board}/members', [BoardMemberController::class, 'store']);
    Route::put('/boards/{board}/members/{user}', [BoardMemberController::class, 'update']);
    Route::delete('/boards/{board}/members/{user}', [BoardMemberController::class, 'destroy']);

    Route::get('/boards/{board}/tasks', [TaskController::class, 'index']);
    Route::get('/boards/{board}/stats', [StatsController::class, 'boardStats']);

    Route::post('/tasks', [TaskController::class, 'store']);
    Route::put('/tasks/{task}', [TaskController::class, 'update']);
    Route::delete('/tasks/{task}', [TaskController::class, 'destroy']);

    Route::get('/stats', [StatsController::class, 'index']);

    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::put('/notifications/read-all', [NotificationController::class, 'markAllRead']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markRead'])->whereNumber('id');
});
