<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function update(Request $request)
    {
        $request->validate([
            'fullname' => 'nullable|string|max:100',
            'avatar'   => 'nullable|string',
        ]);

        $user = $request->user();
        $user->update([
            'fullname' => $request->fullname,
            'avatar'   => $request->avatar,
        ]);

        return response()->json($user->fresh());
    }

    public function destroy(Request $request)
    {
        $request->user()->tokens()->delete();
        $request->user()->delete();
        return response()->json(['success' => true, 'message' => 'Account deleted']);
    }
}
