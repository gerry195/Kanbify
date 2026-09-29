<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Board;
use App\Models\Task;
use Illuminate\Http\Request;

class StatsController extends Controller
{
    // Aggregated stats across every board the user belongs to
    public function index(Request $request)
    {
        $user = $request->user();
        $boardIds = $user->boards()->pluck('boards.id');

        $tasks = Task::whereIn('board_id', $boardIds)->get();

        return response()->json($this->buildStats($tasks, $boardIds));
    }

    // Stats scoped to a single board
    public function boardStats(Request $request, Board $board)
    {
        if (! $board->roleOf($request->user())) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $tasks = $board->tasks;

        return response()->json($this->buildStats($tasks, collect([$board->id])));
    }

    private function buildStats($tasks, $boardIds)
    {
        $total = $tasks->count();
        $done = $tasks->where('status', 'done')->count();
        $inProgress = $tasks->where('status', 'in-progress')->count();
        $todo = $tasks->where('status', 'todo')->count();
        $backlog = $tasks->where('status', 'backlog')->count();

        $completedThisWeek = $tasks->where('status', 'done')
            ->filter(fn ($t) => $t->completed_at && $t->completed_at->greaterThanOrEqualTo(now()->startOfWeek()))
            ->count();

        $perBoard = Board::whereIn('id', $boardIds)->withCount([
            'tasks',
            'tasks as done_tasks_count' => fn ($q) => $q->where('status', 'done'),
        ])->get(['id', 'name'])->map(fn ($b) => [
            'board_id'   => $b->id,
            'name'       => $b->name,
            'total'      => $b->tasks_count,
            'done'       => $b->done_tasks_count,
        ]);

        $recentCompleted = $tasks->where('status', 'done')
            ->sortByDesc('completed_at')
            ->take(5)
            ->values()
            ->map(fn ($t) => [
                'id' => $t->id, 'title' => $t->title,
                'board_id' => $t->board_id, 'completed_at' => $t->completed_at,
            ]);

        return [
            'total_tasks'          => $total,
            'completed_tasks'      => $done,
            'in_progress_tasks'    => $inProgress,
            'todo_tasks'           => $todo,
            'backlog_tasks'        => $backlog,
            'completion_rate'      => $total > 0 ? round($done / $total * 100, 1) : 0,
            'completed_this_week'  => $completedThisWeek,
            'total_time_tracked'   => (int) $tasks->sum('time'),
            'boards_count'         => $boardIds->count(),
            'per_board'            => $perBoard,
            'recent_completed'     => $recentCompleted,
        ];
    }
}
