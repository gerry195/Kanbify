<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Board;
use App\Models\BoardMember;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class BoardController extends Controller
{
    // List every board the logged-in user is a member of, with their role attached
    public function index(Request $request)
    {
        $user = $request->user();

        $boards = $user->boards()
            ->with('members')
            ->withCount([
                'tasks',
                'tasks as done_tasks_count' => fn ($q) => $q->where('status', 'done'),
            ])
            ->orderByDesc('boards.updated_at')
            ->get()
            ->map(function ($board) {
                return [
                    'id'            => $board->id,
                    'name'          => $board->name,
                    'category'      => $board->category,
                    'cover_image'   => $board->cover_image,
                    'owner_id'      => $board->owner_id,
                    'created_at'    => $board->created_at,
                    'updated_at'    => $board->updated_at,
                    'role'          => $board->pivot->role,
                    'starred'       => (bool) $board->pivot->is_starred,
                    'total_tasks'   => $board->tasks_count,
                    'done_tasks'    => $board->done_tasks_count,
                    'members'       => $board->members->map(fn ($m) => [
                        'id' => $m->id, 'username' => $m->username,
                        'fullname' => $m->fullname, 'avatar' => $m->avatar,
                    ]),
                ];
            });

        return response()->json($boards);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'        => 'required|string|max:150',
            'category'    => 'nullable|string|max:50',
            'cover_image' => 'nullable|image|max:5120',
        ]);

        $coverFilename = null;
        if ($request->hasFile('cover_image')) {
            $path = $request->file('cover_image')->store('covers', 'public');
            $coverFilename = basename($path);
        }

        $board = Board::create([
            'owner_id'    => $request->user()->id,
            'name'        => $request->name,
            'category'    => $request->category,
            'cover_image' => $coverFilename,
        ]);

        // Creator automatically becomes admin of the board
        BoardMember::create([
            'board_id' => $board->id,
            'user_id'  => $request->user()->id,
            'role'     => 'admin',
        ]);

        return response()->json([
            'id'          => $board->id,
            'name'        => $board->name,
            'category'    => $board->category,
            'cover_image' => $board->cover_image,
            'role'        => 'admin',
        ], 201);
    }

    public function show(Request $request, Board $board)
    {
        $role = $board->roleOf($request->user());
        if (! $role) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        return response()->json([
            'id'          => $board->id,
            'name'        => $board->name,
            'category'    => $board->category,
            'cover_image' => $board->cover_image,
            'owner_id'    => $board->owner_id,
            'created_at'  => $board->created_at,
            'role'        => $role,
        ]);
    }

    // Toggle "starred" for the current user only — does not affect other members
    public function toggleStar(Request $request, Board $board)
    {
        $membership = \App\Models\BoardMember::where('board_id', $board->id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (! $membership) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $membership->update(['is_starred' => ! $membership->is_starred]);

        return response()->json(['starred' => $membership->is_starred]);
    }

    public function destroy(Request $request, Board $board)
    {
        $role = $board->roleOf($request->user());
        if ($role !== 'admin') {
            return response()->json(['error' => 'Only an admin can delete this board'], 403);
        }

        if ($board->cover_image) {
            Storage::disk('public')->delete('covers/' . $board->cover_image);
        }

        $board->delete();

        return response()->json(['success' => true]);
    }
}
