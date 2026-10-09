<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Board;
use App\Models\Task;
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

        return response()->json(
            $board->tasks()
                ->with('assignees')
                ->orderBy('id')
                ->get()
        );
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
            'due_date'    => 'sometimes|nullable|date',
            'assignees'   => 'sometimes|array',
            'assignees.*' => 'required|integer|distinct|exists:users,id',
        ]);

        $assigneeIds = $data['assignees'] ?? null;

        if ($assigneeIds !== null) {
            $this->validateBoardAssignees($board, $assigneeIds);
        }

        $newStatus = $data['status'] ?? $task->status;

        $running = array_key_exists('isRunning', $data)
            ? $data['isRunning']
            : ($data['is_running'] ?? $task->is_running);

        DB::transaction(function () use (
            $task,
            $data,
            $newStatus,
            $running,
            $assigneeIds
        ) {
            $updates = [];

            foreach ([
                'title',
                'description',
                'priority',
                'time',
                'color',
                'due_date',
            ] as $field) {
                if (array_key_exists($field, $data)) {
                    $updates[$field] = $data[$field];
                }
            }

            if (array_key_exists('status', $data)) {
                $updates['status'] = $newStatus;
            }

            if (
                array_key_exists('isRunning', $data)
                || array_key_exists('is_running', $data)
            ) {
                $updates['is_running'] = $running;
            }

            if ($newStatus === 'done') {
                $updates['completed_at'] = $task->completed_at ?? now();
            } else {
                $updates['completed_at'] = null;
            }

            if (! empty($updates)) {
                $task->update($updates);
            }

            // Hanya mengganti assignee jika field dikirim oleh frontend.
            // Array kosong berarti menghapus semua assignee.
            if ($assigneeIds !== null) {
                $task->assignees()->sync($assigneeIds);
            }
        });

        return response()->json([
            'success' => true,
            'task' => $task->fresh()->load('assignees'),
        ]);
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

        $task->delete();

        return response()->json(['success' => true]);
    }
}
