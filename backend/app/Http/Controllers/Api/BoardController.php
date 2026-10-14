<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Board;
use App\Models\BoardMember;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class BoardController extends Controller
{
    // =========================================================
    // LIST BOARDS
    // =========================================================

    // List every board the logged-in user is a member of,
    // with their role attached.
    public function index(Request $request)
    {
        $user = $request->user();

        $boards = $user->boards()
            ->with('members')
            ->withCount([
                'tasks',
                'tasks as done_tasks_count' => fn ($q) =>
                    $q->where('status', 'done'),
            ])
            ->orderByDesc('boards.updated_at')
            ->get()
            ->map(function ($board) {

                $role = $board->pivot->role;

                return [
                    'id'            => $board->id,
                    'name'          => $board->name,
                    'category'      => $board->category,
                    'cover_image'   => $board->cover_image,
                    'background'    => $board->background ?? 'whiteboard',
                    'background_image' => $board->background_image,
                    'owner_id'      => $board->owner_id,
                    'created_at'    => $board->created_at,
                    'updated_at'    => $board->updated_at,

                    // Role user pada board
                    'role'          => $role,

                    // =================================================
                    // INVITE CODE
                    // =================================================
                    // Hanya admin/pemilik board yang mendapatkan
                    // kode undangan.
                    'invite_code'   => $role === 'admin'
                        ? $board->invite_code
                        : null,

                    // Starred hanya berlaku untuk user yang sedang login
                    'starred'       => (bool) $board->pivot->is_starred,

                    // Statistik tugas
                    'total_tasks'   => $board->tasks_count,
                    'done_tasks'    => $board->done_tasks_count,

                    // Member board
                    'members'       => $board->members->map(
                        fn ($m) => [
                            'id'       => $m->id,
                            'username' => $m->username,
                            'fullname' => $m->fullname,
                            'avatar'   => $m->avatar,
                        ]
                    ),
                ];
            });

        return response()->json($boards);
    }


    // Global calendar data for every board the current user belongs to.
    public function calendarTasks(Request $request)
    {
        $tasks = \App\Models\Task::query()
            ->whereHas('board.members', fn ($query) => $query->where('users.id', $request->user()->id))
            ->with(['board:id,name', 'assignees:id,username,fullname'])
            ->orderBy('due_date')
            ->get();
        return response()->json($tasks);
    }

    public function updateAppearance(Request $request, Board $board)
    {
        if ($board->roleOf($request->user()) !== 'admin') {
            return response()->json(['error' => 'Hanya admin yang dapat mengubah background board.'], 403);
        }
        $data = $request->validate([
            'background' => 'required|string|in:whiteboard,green,blue,cream,dark',
            'background_image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
            'remove_background_image' => 'nullable|boolean',
        ]);
        if ($request->hasFile('background_image')) {
            if ($board->background_image) Storage::disk('public')->delete($board->background_image);
            $data['background_image'] = $request->file('background_image')->store('board-backgrounds', 'public');
        } elseif ($board->background_image) {
            // Switching to a preset clears the previously uploaded custom image.
            Storage::disk('public')->delete($board->background_image);
            $data['background_image'] = null;
        }
        $board->background = $data['background'];
        if (array_key_exists('background_image', $data)) $board->background_image = $data['background_image'];
        $board->save();
        return response()->json(['success' => true, 'background' => $board->background, 'background_image' => $board->background_image]);
    }

    // =========================================================
    // CREATE BOARD
    // =========================================================

    public function store(Request $request)
    {
        $request->validate([
            'name'        => 'required|string|max:150',
            'category'    => 'nullable|string|max:50',
            'cover_image' => 'nullable|image|max:5120',
        ]);

        $coverFilename = null;

        // Upload cover image
        if ($request->hasFile('cover_image')) {
            $path = $request
                ->file('cover_image')
                ->store('covers', 'public');

            $coverFilename = basename($path);
        }

        // =========================================================
        // CREATE BOARD
        // =========================================================

        $board = Board::create([
            'owner_id'    => $request->user()->id,
            'name'        => $request->name,
            'category'    => $request->category,

            'cover_image' => $coverFilename,

            // Generate invite code otomatis
            'invite_code' => strtoupper(Str::random(8)),
        ]);

        // =========================================================
        // CREATOR = ADMIN
        // =========================================================

        BoardMember::create([
            'board_id' => $board->id,
            'user_id'  => $request->user()->id,
            'role'     => 'admin',
        ]);

        // =========================================================
        // RESPONSE
        // =========================================================

        return response()->json([
            'id'          => $board->id,
            'name'        => $board->name,
            'category'    => $board->category,
            'cover_image' => $board->cover_image,

            // Kode undangan langsung diberikan kepada creator
            'invite_code' => $board->invite_code,

            'role'        => 'admin',
        ], 201);
    }


    // =========================================================
    // SHOW BOARD
    // =========================================================

    public function show(Request $request, Board $board)
    {
        $role = $board->roleOf($request->user());

        if (! $role) {
            return response()->json([
                'error' => 'Forbidden'
            ], 403);
        }

        return response()->json([
            'id'          => $board->id,
            'name'        => $board->name,
            'category'    => $board->category,
            'cover_image' => $board->cover_image,
            'background'  => $board->background ?? 'whiteboard',
            'background_image' => $board->background_image,
            'owner_id'    => $board->owner_id,
            'created_at'  => $board->created_at,
            'role'        => $role,

            // Hanya admin yang boleh melihat kode
            'invite_code' => $role === 'admin'
                ? $board->invite_code
                : null,
        ]);
    }


    // =========================================================
    // JOIN BOARD
    // =========================================================

    public function join(Request $request)
    {
        $request->validate([
            'invite_code' => 'required|string|max:20',
        ]);

        $user = $request->user();

        // Cari board berdasarkan kode undangan
        $board = Board::where(
            'invite_code',
            strtoupper(trim($request->invite_code))
        )->first();

        // =========================================================
        // INVALID CODE
        // =========================================================

        if (! $board) {
            return response()->json([
                'error' => 'Kode undangan tidak ditemukan'
            ], 404);
        }

        // =========================================================
        // CHECK EXISTING MEMBER
        // =========================================================

        if ($board->roleOf($user)) {
            return response()->json([
                'error' => 'Kamu sudah menjadi anggota board ini'
            ], 422);
        }

        // =========================================================
        // ADD MEMBER
        // =========================================================

        BoardMember::create([
            'board_id' => $board->id,
            'user_id'  => $user->id,

            // User yang join melalui invite code
            // menjadi member, bukan admin.
            'role'     => 'member',
        ]);

        // =========================================================
        // RESPONSE
        // =========================================================

        return response()->json([
            'success' => true,

            'message' => 'Berhasil bergabung ke board',

            'board' => [
                'id'          => $board->id,
                'name'        => $board->name,
                'category'    => $board->category,
                'cover_image' => $board->cover_image,
                'background'  => $board->background ?? 'whiteboard',
                'background_image' => $board->background_image,
                'role'        => 'member',
            ],
        ], 201);
    }


    // =========================================================
    // TOGGLE STAR
    // =========================================================

    // Toggle "starred" for the current user only.
    // Does not affect other members.
    public function toggleStar(Request $request, Board $board)
    {
        $membership = BoardMember::where(
            'board_id',
            $board->id
        )
            ->where(
                'user_id',
                $request->user()->id
            )
            ->first();

        if (! $membership) {
            return response()->json([
                'error' => 'Forbidden'
            ], 403);
        }

        $membership->update([
            'is_starred' => ! $membership->is_starred
        ]);

        return response()->json([
            'starred' => $membership->is_starred
        ]);
    }


    // =========================================================
    // DELETE BOARD
    // =========================================================

    public function destroy(Request $request, Board $board)
    {
        $role = $board->roleOf($request->user());

        // Hanya admin/pemilik yang boleh menghapus board
        if ($role !== 'admin') {
            return response()->json([
                'error' => 'Only an admin can delete this board'
            ], 403);
        }

        // Hapus cover image jika ada
        if ($board->cover_image) {
            Storage::disk('public')->delete(
                'covers/' . $board->cover_image
            );
        }

        // Hapus board
        $board->delete();

        return response()->json([
            'success' => true
        ]);
    }
}