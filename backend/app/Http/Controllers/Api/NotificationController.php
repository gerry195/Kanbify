<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BoardNotification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * 30 notifikasi terbaru milik user yang login + jumlah belum dibaca.
     *
     * Bentuk tiap item:
     * { id, type, read, created_at, actor:{id,fullname,username,avatar},
     *   board:{id,name}, task:{id,title}, data }
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $items = BoardNotification::with([
                'actor:id,username,fullname,avatar',
                'board:id,name',
            ])
            ->where('recipient_id', $user->id)
            ->orderByDesc('id')
            ->limit(30)
            ->get()
            ->map(fn (BoardNotification $n) => [
                'id'         => $n->id,
                'type'       => $n->type,
                'read'       => $n->read_at !== null,
                'created_at' => $n->created_at,
                'actor'      => $n->actor ? [
                    'id'       => $n->actor->id,
                    'fullname' => $n->actor->fullname,
                    'username' => $n->actor->username,
                    'avatar'   => $n->actor->avatar,
                ] : null,
                'board'      => $n->board ? ['id' => $n->board->id, 'name' => $n->board->name] : null,
                'task'       => ['id' => $n->task_id, 'title' => $n->task_title],
                'data'       => $n->data,
            ]);

        return response()->json([
            'unread' => BoardNotification::where('recipient_id', $user->id)->whereNull('read_at')->count(),
            'items'  => $items,
        ]);
    }

    public function markRead(Request $request, int $id)
    {
        BoardNotification::where('recipient_id', $request->user()->id)
            ->where('id', $id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['success' => true]);
    }

    public function markAllRead(Request $request)
    {
        BoardNotification::where('recipient_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['success' => true]);
    }
}
