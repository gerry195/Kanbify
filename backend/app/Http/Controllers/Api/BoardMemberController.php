<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Board;
use App\Models\BoardMember;
use App\Models\User;
use Illuminate\Http\Request;

class BoardMemberController extends Controller
{
    public function index(Request $request, Board $board)
    {
        if (! $board->roleOf($request->user())) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $members = $board->members()->get()->map(fn ($u) => [
            'id'       => $u->id,
            'username' => $u->username,
            'fullname' => $u->fullname,
            'email'    => $u->email,
            'avatar'   => $u->avatar,
            'role'     => $u->pivot->role,
        ]);

        return response()->json($members);
    }

    public function store(Request $request, Board $board)
    {
        if ($board->roleOf($request->user()) !== 'admin') {
            return response()->json(['error' => 'Only an admin can add members'], 403);
        }

        $request->validate([
            'username' => 'required|string|exists:users,username',
            'role'     => 'nullable|in:admin,member',
        ]);

        $newUser = User::where('username', $request->username)->firstOrFail();

        if ($board->roleOf($newUser)) {
            return response()->json(['error' => 'User is already a member of this board'], 422);
        }

        BoardMember::create([
            'board_id' => $board->id,
            'user_id'  => $newUser->id,
            'role'     => $request->role ?? 'member',
        ]);

        return response()->json(['success' => true, 'message' => 'Member added'], 201);
    }

    public function update(Request $request, Board $board, User $user)
    {
        if ($board->roleOf($request->user()) !== 'admin') {
            return response()->json(['error' => 'Only an admin can change roles'], 403);
        }

        $request->validate(['role' => 'required|in:admin,member']);

        $membership = BoardMember::where('board_id', $board->id)->where('user_id', $user->id)->firstOrFail();
        $membership->update(['role' => $request->role]);

        return response()->json(['success' => true]);
    }

    public function destroy(Request $request, Board $board, User $user)
    {
        if ($board->roleOf($request->user()) !== 'admin') {
            return response()->json(['error' => 'Only an admin can remove members'], 403);
        }

        if ($board->owner_id === $user->id) {
            return response()->json(['error' => 'Cannot remove the board owner'], 422);
        }

        BoardMember::where('board_id', $board->id)->where('user_id', $user->id)->delete();

        return response()->json(['success' => true]);
    }
}
