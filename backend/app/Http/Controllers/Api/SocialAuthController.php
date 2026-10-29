<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SocialAccount;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

/*
 * Login lewat Google (OAuth 2.0 + Socialite, tanpa session).
 *
 * Alur:
 *   1. GET  /api/auth/google/redirect   -> pengguna dikirim ke Google
 *   2. GET  /api/auth/google/callback   -> Google kembali ke sini; akun dicari/dibuat,
 *                                          lalu pengguna dialihkan ke frontend
 *                                          /auth/callback?code=<kode sekali pakai>
 *   3. POST /api/auth/social/exchange   -> frontend menukar kode itu dengan token Sanctum
 *
 * Token tidak pernah ditaruh di URL; yang ada di URL hanya kode yang berlaku
 * 60 detik dan hanya bisa dipakai sekali.
 */
class SocialAuthController extends Controller
{
    private const PROVIDERS = ['google'];

    public function redirect(string $provider)
    {
        $this->assertProvider($provider);

        return Socialite::driver($provider)->stateless()->redirect();
    }

    public function callback(Request $request, string $provider)
    {
        $this->assertProvider($provider);

        // Pengguna menekan "Batal" di layar Google.
        if ($request->filled('error')) {
            return $this->toFrontend('/', ['social_error' => 'Login Google dibatalkan.']);
        }

        try {
            $social = Socialite::driver($provider)->stateless()->user();
        } catch (\Throwable $e) {
            report($e);

            return $this->toFrontend('/', ['social_error' => 'Login Google gagal. Coba lagi.']);
        }

        if (! $social->getEmail()) {
            return $this->toFrontend('/', ['social_error' => 'Akun Google tidak menyediakan email.']);
        }

        $verified = (bool) ($social->user['email_verified'] ?? false);

        $user = DB::transaction(fn () => $this->resolveUser($provider, $social, $verified));

        if (! $user) {
            return $this->toFrontend('/', [
                'social_error' => 'Email Google belum terverifikasi, tidak bisa dipakai masuk.',
            ]);
        }

        $code = Str::random(48);
        Cache::put("social_login:{$code}", $user->id, now()->addSeconds(60));

        return $this->toFrontend('/auth/callback', ['code' => $code]);
    }

    public function exchange(Request $request)
    {
        $request->validate(['code' => 'required|string|size:48']);

        $userId = Cache::pull("social_login:{$request->code}");

        $user = $userId ? User::find($userId) : null;

        if (! $user) {
            return response()->json(['error' => 'Kode login tidak valid atau sudah kedaluwarsa.'], 422);
        }

        return response()->json([
            'token' => $user->createToken('kanbify-token')->plainTextToken,
            'user'  => $user,
        ]);
    }

    /* ---------------------------------------------------------------- */

    private function resolveUser(string $provider, $social, bool $verified): ?User
    {
        // 1. Sudah pernah masuk lewat akun Google ini.
        $linked = SocialAccount::where('provider', $provider)
            ->where('provider_id', $social->getId())
            ->first();

        if ($linked) {
            return $linked->user;
        }

        if (! $verified) {
            return null;
        }

        // 2. Email sama dengan akun yang sudah ada: tautkan.
        $user = User::where('email', $social->getEmail())->first();

        // 3. Belum ada: buat akun baru.
        if (! $user) {
            $user = User::create([
                'username' => $this->uniqueUsername($social->getEmail()),
                'email'    => $social->getEmail(),
                'password' => null,
                'fullname' => Str::limit($social->getName() ?: '', 100, ''),
                'avatar'   => $this->downloadAvatar($social->getAvatar()),
            ]);
        }

        $user->socialAccounts()->create([
            'provider'    => $provider,
            'provider_id' => $social->getId(),
        ]);

        return $user;
    }

    private function uniqueUsername(string $email): string
    {
        $base = Str::of(Str::before($email, '@'))
            ->lower()
            ->replaceMatches('/[^a-z0-9_]/', '')
            ->limit(40, '')
            ->toString() ?: 'user';

        $name = $base;
        while (User::where('username', $name)->exists()) {
            $name = $base . random_int(100, 99999);
        }

        return $name;
    }

    /*
     * Avatar Kanbify disimpan sebagai data URI, jadi foto Google diunduh sekali
     * lalu disimpan. Gagal diunduh bukan masalah: avatar dibiarkan kosong.
     */
    private function downloadAvatar(?string $url): ?string
    {
        if (! $url) {
            return null;
        }

        try {
            $url = preg_replace('/=s\d+(-c)?$/', '=s200-c', $url);
            $res = Http::timeout(5)->get($url);
            $mime = strtok((string) $res->header('Content-Type'), ';');

            if ($res->successful() && str_starts_with((string) $mime, 'image/') && strlen($res->body()) < 300_000) {
                return 'data:' . $mime . ';base64,' . base64_encode($res->body());
            }
        } catch (\Throwable $e) {
            // abaikan
        }

        return null;
    }

    private function toFrontend(string $path, array $query)
    {
        $base = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173')), '/');

        return redirect()->away($base . $path . '?' . http_build_query($query));
    }

    private function assertProvider(string $provider): void
    {
        abort_unless(in_array($provider, self::PROVIDERS, true), 404);
    }
}
