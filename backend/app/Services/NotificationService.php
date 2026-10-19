<?php

namespace App\Services;

use App\Models\Board;
use App\Models\BoardNotification;
use App\Models\User;

/**
 * Membuat notifikasi aktivitas untuk semua anggota board
 * kecuali pelakunya sendiri.
 */
class NotificationService
{
    public static function taskStatusChanged(Board $board, User $actor, int $taskId, string $title, string $from, string $to): void
    {
        self::fanOut($board, $actor, 'task_status', $taskId, $title, [
            'from' => $from,
            'to'   => $to,
        ]);
    }

    /** @param string[] $fields  nama bidang yang berubah: title, description, priority, due_date, start_date, assignees */
    public static function taskUpdated(Board $board, User $actor, int $taskId, string $title, array $fields): void
    {
        if (empty($fields)) {
            return;
        }

        self::fanOut($board, $actor, 'task_updated', $taskId, $title, [
            'fields' => array_values($fields),
        ]);
    }

    public static function taskDeleted(Board $board, User $actor, string $title): void
    {
        self::fanOut($board, $actor, 'task_deleted', null, $title, null);
    }

    private static function fanOut(Board $board, User $actor, string $type, ?int $taskId, string $title, ?array $data): void
    {
        $recipientIds = $board->boardMembers()
            ->where('user_id', '!=', $actor->id)
            ->pluck('user_id');

        $now = now();

        $rows = $recipientIds->map(fn ($id) => [
            'recipient_id' => $id,
            'actor_id'     => $actor->id,
            'board_id'     => $board->id,
            'type'         => $type,
            'task_id'      => $taskId,
            'task_title'   => mb_substr($title, 0, 255),
            'data'         => $data === null ? null : json_encode($data),
            'created_at'   => $now,
        ])->all();

        if (! empty($rows)) {
            BoardNotification::insert($rows);
        }
    }

    /**
     * Kalimat aktivitas dalam bahasa Indonesia.
     * Dipakai oleh email. Frontend menyusun kalimatnya sendiri
     * dari field yang sama.
     */
    public static function describe(BoardNotification $n): string
    {
        $title  = '“' . $n->task_title . '”';
        $labels = ['backlog' => 'Backlog', 'todo' => 'To Do', 'in-progress' => 'On Progress', 'done' => 'Done'];

        return match ($n->type) {
            'task_status' => ($n->data['to'] ?? '') === 'done'
                ? "menyelesaikan {$title}"
                : "memindahkan {$title} dari " . ($labels[$n->data['from'] ?? ''] ?? '?') . ' ke ' . ($labels[$n->data['to'] ?? ''] ?? '?'),
            'task_updated' => "mengubah {$title} (" . self::fieldList($n->data['fields'] ?? []) . ')',
            'task_deleted' => "menghapus tugas {$title}",
            default        => "melakukan perubahan pada {$title}",
        };
    }

    private static function fieldList(array $fields): string
    {
        $map = [
            'title'       => 'judul',
            'description' => 'deskripsi',
            'priority'    => 'prioritas',
            'due_date'    => 'deadline',
            'start_date'  => 'tanggal mulai',
            'assignees'   => 'anggota',
        ];

        return implode(', ', array_map(fn ($f) => $map[$f] ?? $f, $fields));
    }
}
