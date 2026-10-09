<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Board;
use App\Models\Task;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function index(Request $request, Board $board)
    {
        if (! $board->roleOf($request->user())) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        return response()->json($board->tasks()->with('assignee:id,username,fullname,avatar')->orderBy('id')->get());
    }

    // Only board admins may create tasks
    public function store(Request $request)
    {
        $request->validate([
            'board_id'    => 'required|exists:boards,id',
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'status'      => 'nullable|in:backlog,todo,in-progress,done',
            'priority'    => 'nullable|in:sangat_rendah,rendah,sedang,tinggi,sangat_tinggi',
            'color'       => 'nullable|string',
            'due_date'    => 'nullable|date',
            'time'        => 'nullable|integer',
            'is_running'  => 'nullable|boolean',
            'assigned_user_id' => 'nullable|integer|exists:users,id',
        ]);

        $board = Board::findOrFail($request->board_id);
        if ($board->roleOf($request->user()) !== 'admin') {
            return response()->json(['error' => 'Only an admin can add tasks'], 403);
        }

        $assignedUserId = $request->input('assigned_user_id');
        if ($assignedUserId && ! $board->roleOf(\App\Models\User::findOrFail($assignedUserId))) {
            return response()->json(['error' => 'Member yang dipilih bukan anggota board ini'], 422);
        }

        $status = $request->status ?? 'todo';

        $task = Task::create([
            'board_id'     => $board->id,
            'user_id'      => $request->user()->id,
            'assigned_user_id' => $assignedUserId,
            'title'        => $request->title,
            'description'  => $request->description ?? '',
            'status'       => $status,
            'priority'     => $request->priority ?? 'sedang',
            'color'        => $request->color,
            'time'         => $request->time ?? 0,
            'is_running'   => (bool) ($request->is_running ?? $request->boolean('is_running')),
            'due_date'     => $request->due_date,
            'completed_at' => $status === 'done' ? now() : null,
        ]);

        return response()->json($task->load('assignee:id,username,fullname,avatar'), 201);
    }

    // Any board member may update/move a task (edit note, drag between columns, run timer)
    public function update(Request $request, Task $task)
    {
        $board = $task->board;
        if (! $board->roleOf($request->user())) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $request->validate([
            'title'       => 'sometimes|string|max:255',
            'status'      => 'nullable|in:backlog,todo,in-progress,done',
            'priority'    => 'nullable|in:sangat_rendah,rendah,sedang,tinggi,sangat_tinggi',
            'time'        => 'nullable|integer',
            'isRunning'   => 'nullable|boolean',
            'is_running'  => 'nullable|boolean',
            'description' => 'nullable|string',
            'color'       => 'nullable|string',
            'due_date'    => 'nullable|date',
            'assigned_user_id' => 'nullable|integer|exists:users,id',
        ]);

        if ($request->has('assigned_user_id') && $request->input('assigned_user_id')) {
            $assignee = \App\Models\User::findOrFail($request->input('assigned_user_id'));
            if (! $board->roleOf($assignee)) {
                return response()->json(['error' => 'Member yang dipilih bukan anggota board ini'], 422);
            }
        }

        $running = $request->has('isRunning') ? $request->boolean('isRunning') : $request->boolean('is_running');
        $newStatus = $request->status ?? $task->status;

        $task->update([
            'title'        => $request->title ?? $task->title,
            'status'       => $newStatus,
            'priority'     => $request->priority ?? $task->priority,
            'time'         => $request->time ?? $task->time,
            'is_running'   => $running,
            'description'  => $request->description ?? '',
            'color'        => $request->color,
            'due_date'     => $request->due_date,
            'assigned_user_id' => $request->has('assigned_user_id') ? $request->input('assigned_user_id') : $task->assigned_user_id,
            'completed_at' => $newStatus === 'done'
                ? ($task->completed_at ?? now())
                : null,
        ]);

        return response()->json(['success' => true, 'task' => $task->fresh()]);
    }

    // Only board admins may delete tasks
    public function destroy(Request $request, Task $task)
    {
        $board = $task->board;
        if ($board->roleOf($request->user()) !== 'admin') {
            return response()->json(['error' => 'Only an admin can delete tasks'], 403);
        }

        $task->delete();

        return response()->json(['success' => true]);
    }
}
