<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Board;
use App\Models\Task;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TaskController extends Controller
{
    /**
     * Menampilkan semua tugas pada board.
     * Hanya anggota board yang dapat mengaksesnya.
     */
public function index(Request $request, Board $board)
{
    if (! $board->roleOf($request->user())) {
        return response()->json(['error' => 'Forbidden'], 403);
    }

    $tasks = $board->tasks()
        ->with('assignees')
        ->orderBy('id')
        ->get();

    $now = now();

    $tasks->transform(function ($task) use ($now) {
        if ($task->is_running && $task->started_at) {
            $elapsed = max(
                0,
                $now->timestamp - $task->started_at->timestamp
            );

            $task->time = (int) $task->time + $elapsed;
        }

        return $task;
    });

    return response()->json($tasks);
}

    /**
     * Memastikan semua assignee merupakan anggota board.
     */
    private function validateBoardAssignees(Board $board, array $assigneeIds): void
    {
        if (empty($assigneeIds)) {
            return;
        }

        $memberIds = DB::table('board_members')
            ->where('board_id', $board->id)
            ->whereIn('user_id', $assigneeIds)
            ->pluck('user_id')
            ->map(fn ($id) => (int) $id)
            ->all();

        $invalidIds = array_diff(
            array_map('intval', $assigneeIds),
            $memberIds
        );

        if (! empty($invalidIds)) {
            throw ValidationException::withMessages([
                'assignees' => [
                    'Semua anggota yang dipilih harus merupakan anggota board ini.',
                ],
            ]);
        }
    }

    /**
     * Membuat tugas baru.
     * Semua anggota board boleh membuat tugas.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'board_id'    => 'required|exists:boards,id',
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'status'      => 'nullable|in:backlog,todo,in-progress,done',
            'priority'    => 'nullable|in:sangat-tinggi,tinggi,sedang,rendah,sangat-rendah',
            'color'       => 'nullable|string',
            'start_date'  => 'nullable|date',
            'due_date'    => 'nullable|date',
            'time'        => 'nullable|integer|min:0',
            'is_running'  => 'nullable|boolean',
            'assignees'   => 'sometimes|array',
            'assignees.*' => 'required|integer|distinct|exists:users,id',
        ]);

        $board = Board::findOrFail($data['board_id']);

        if (! $board->roleOf($request->user())) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $assigneeIds = $data['assignees'] ?? [];

        $this->validateBoardAssignees($board, $assigneeIds);

        $status = $data['status'] ?? 'todo';

        $task = DB::transaction(function () use (
            $data,
            $board,
            $request,
            $status,
            $assigneeIds
        ) {
            $task = Task::create([
                'board_id'     => $board->id,
                'user_id'      => $request->user()->id,
                'title'        => $data['title'],
                'description'  => $data['description'] ?? '',
                'status'       => $status,
                'priority'     => $data['priority'] ?? 'sedang',
                'color'        => $data['color'] ?? null,
                'time'         => $data['time'] ?? 0,
                'is_running'   => $data['is_running'] ?? false,
                'start_date'   => $data['start_date'] ?? null,
                'due_date'     => $data['due_date'] ?? null,
                'completed_at' => $status === 'done' ? now() : null,
            ]);

            $task->assignees()->sync($assigneeIds);

            return $task;
        });

        return response()->json(
            $task->load('assignees'),
            201
        );
    }

    /**
     * Memperbarui tugas atau memindahkannya antar kolom.
     * Semua anggota board boleh memperbarui tugas.
     */
public function update(Request $request, Task $task)
{
    $board = $task->board;

    if (! $board->roleOf($request->user())) {
        return response()->json(['error' => 'Forbidden'], 403);
    }

    $data = $request->validate([
        'title'       => 'sometimes|required|string|max:255',
        'status'      => 'sometimes|nullable|in:backlog,todo,in-progress,done',
        'priority'    => 'sometimes|nullable|in:sangat-tinggi,tinggi,sedang,rendah,sangat-rendah',
        'time'        => 'sometimes|nullable|integer|min:0',
        'isRunning'   => 'sometimes|boolean',
        'is_running'  => 'sometimes|boolean',
        'description' => 'sometimes|nullable|string',
        'color'       => 'sometimes|nullable|string',
        'start_date'  => 'sometimes|nullable|date',
        'due_date'    => 'sometimes|nullable|date',
        'assignees'   => 'sometimes|array',
        'assignees.*' => 'required|integer|distinct|exists:users,id',
    ]);

    $assigneeIds = $data['assignees'] ?? null;

    if ($assigneeIds !== null) {
        $this->validateBoardAssignees($board, $assigneeIds);
    }

    $oldStatus = $task->status;

    $changedFields = $this->changedFields(
        $task,
        $data,
        $assigneeIds
    );

    $fresh = DB::transaction(function () use (
        $task,
        $data,
        $assigneeIds
    ) {
        // Ambil data terbaru agar perubahan timer lebih aman
        // saat beberapa anggota mengakses task yang sama.
        $lockedTask = Task::whereKey($task->id)
            ->lockForUpdate()
            ->firstOrFail();

        $updates = [];

        foreach ([
            'title',
            'description',
            'priority',
            'color',
            'start_date',
            'due_date',
        ] as $field) {
            if (array_key_exists($field, $data)) {
                $updates[$field] = $data[$field];
            }
        }

        $newStatus = $data['status'] ?? $lockedTask->status;

        if (array_key_exists('status', $data)) {
            $updates['status'] = $newStatus;
        }

        $requestedRunning = array_key_exists('isRunning', $data)
            ? $data['isRunning']
            : ($data['is_running'] ?? $lockedTask->is_running);

        // Task yang selesai tidak boleh terus menghitung waktu.
        if ($newStatus === 'done') {
            $requestedRunning = false;
        }

        $wasRunning = (bool) $lockedTask->is_running;
        $isRunning = (bool) $requestedRunning;
        $now = now();

        // Hanya akumulasikan waktu ketika timer benar-benar berhenti.
        if ($wasRunning && (! $isRunning || $newStatus === 'done')) {
            $startedAt = $lockedTask->started_at;

            if ($startedAt) {
                $elapsed = max(
                    0,
                    $now->timestamp - $startedAt->timestamp
                );

                $updates['time'] = (int) $lockedTask->time + $elapsed;
            }

            $updates['is_running'] = false;
            $updates['started_at'] = null;
        } elseif (! $wasRunning && $isRunning) {
            // Timer baru mulai: jangan menghapus durasi sebelumnya.
            $updates['is_running'] = true;
            $updates['started_at'] = $now;
        } elseif ($wasRunning && $isRunning) {
            // Timer masih berjalan: pertahankan waktu mulai sebelumnya.
            $updates['is_running'] = true;
        } else {
            $updates['is_running'] = false;
            $updates['started_at'] = null;

            // Hanya terima nilai time dari frontend ketika timer berhenti.
            if (array_key_exists('time', $data)) {
                $updates['time'] = $data['time'] ?? 0;
            }
        }

        if ($newStatus === 'done') {
            $updates['completed_at'] = $lockedTask->completed_at ?? $now;
        } else {
            $updates['completed_at'] = null;
        }

        $lockedTask->update($updates);

        if ($assigneeIds !== null) {
            $lockedTask->assignees()->sync($assigneeIds);
        }

        return $lockedTask->fresh();
    });

    if ($oldStatus !== $fresh->status) {
        NotificationService::taskStatusChanged(
            $board,
            $request->user(),
            $fresh->id,
            $fresh->title,
            $oldStatus,
            $fresh->status
        );
    }

    NotificationService::taskUpdated(
        $board,
        $request->user(),
        $fresh->id,
        $fresh->title,
        $changedFields
    );

    // Kembalikan durasi berjalan yang sudah dihitung,
    // tanpa menyimpannya setiap detik ke database.
    if ($fresh->is_running && $fresh->started_at) {
        $fresh->time = (int) $fresh->time + max(
            0,
            now()->timestamp - $fresh->started_at->timestamp
        );
    }

    return response()->json([
        'success' => true,
        'task' => $fresh->load('assignees'),
    ]);
}

    /**
     * Daftar bidang yang benar-benar berubah (untuk notifikasi).
     */
    private function changedFields(Task $task, array $data, ?array $assigneeIds): array
    {
        $changed = [];

        foreach (['title', 'description', 'priority'] as $field) {
            if (array_key_exists($field, $data) && (string) $data[$field] !== (string) $task->{$field}) {
                $changed[] = $field;
            }
        }

        foreach (['due_date', 'start_date'] as $field) {
            if (! array_key_exists($field, $data)) {
                continue;
            }

            $new = $data[$field] ? date('Y-m-d', strtotime($data[$field])) : null;
            $old = $task->{$field}?->format('Y-m-d');

            if ($new !== $old) {
                $changed[] = $field;
            }
        }

        if ($assigneeIds !== null) {
            $old = $task->assignees()->pluck('users.id')->map(fn ($i) => (int) $i)->sort()->values()->all();
            $new = collect($assigneeIds)->map(fn ($i) => (int) $i)->sort()->values()->all();

            if ($old !== $new) {
                $changed[] = 'assignees';
            }
        }

        return $changed;
    }

    /**
     * Menghapus tugas.
     * Semua anggota board boleh menghapus tugas.
     */
    public function destroy(Request $request, Task $task)
    {
        $board = $task->board;

        if (! $board->roleOf($request->user())) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $title = $task->title;

        $task->delete();

        NotificationService::taskDeleted($board, $request->user(), $title);

        return response()->json(['success' => true]);
    }
}
