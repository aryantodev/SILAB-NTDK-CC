<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Mail\WelcomeEmail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    // ==========================================
    // 1. REGISTER (Username, Email, Pass, Institusi, NoHP)
    // ==========================================
    public function register(Request $request)
    {
        // Validasi
        $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:users'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'institusi' => ['required', 'string', 'in:Umum,Dosen IPB,Mahasiswa IPB,Tendik IPB'],
            'nomor_telpon' => ['required', 'string', 'max:20'],
        ]);

        // Buat User
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'institusi' => $request->institusi,
            'nomor_telpon' => $request->nomor_telpon,
            'role' => 'klien',
            'login_count' => 0,
        ]);

        try {
            Mail::to($user->email)->send(new WelcomeEmail($user));
        } catch (\Exception $e) {
            Log::error('Gagal kirim welcome email: ' . $e->getMessage());
        }

        /** @var string $token */
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Registrasi berhasil! Silakan lengkapi Nama Lengkap Anda.',
            'user' => $user,
            'token' => $token
        ], 201);
    }

    // ==========================================
    // 2. LOGIN
    // ==========================================
    public function login(Request $request)
    {
        $request->validate([
            'name' => ['required', 'string'],
            'password' => ['required'],
        ]);

        $loginName = (string) $request->input('name');
        $key = Str::lower($loginName) . '|' . $request->ip();
        $maxAttempts = 5;
        $decaySeconds = 5 * 60;

        if (RateLimiter::tooManyAttempts($key, $maxAttempts)) {
            if (Auth::attempt($request->only('name', 'password'))) {
                RateLimiter::clear($key);
            } else {
                $seconds = RateLimiter::availableIn($key) ?: $decaySeconds;
                RateLimiter::hit($key, $decaySeconds);
                return response()->json([
                    'message' => 'Terlalu banyak percobaan. Silakan coba lagi nanti.'
                ], 429)->header('Retry-After', $seconds);
            }
        } else {
            if (!Auth::attempt($request->only('name', 'password'))) {
                RateLimiter::hit($key, $decaySeconds);
                return response()->json([
                    'message' => 'Username atau password salah.'
                ], 401);
            }
        }

        /** @var \App\Models\User $user */
        $user = Auth::user();

        if (isset($user->status) && $user->status === 'Non-Aktif') {
            Auth::logout();
            return response()->json([
                'message' => 'Akun Anda telah dinonaktifkan. Silakan hubungi administrator.'
            ], 403);
        }

        $user->increment('login_count');
        $this->checkLoginAchievements($user);
        $this->checkTechnicianAchievements($user);

        $token = $user->createToken('auth_token')->plainTextToken;

        // Solusi URL Manual anti-error method url()
        $avatarUrl = null;
        if ($user->avatar) {
            $avatarUrl = "https://" . config('filesystems.disks.s3.bucket') . ".s3." . config('filesystems.disks.s3.region') . ".amazonaws.com/" . $user->avatar;
        }

        return response()->json([
            'message' => 'Login berhasil',
            'access_token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'full_name' => $user->full_name,
                'email' => $user->email,
                'role' => $user->role,
                'avatar' => $user->avatar,
                'avatar_url' => $avatarUrl,
                'institusi' => $user->institusi,
                'nomor_telpon' => $user->nomor_telpon,
            ]
        ], 200);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logout berhasil'], 200);
    }

    // ==========================================
    // 3. ME (DATA USER)
    // ==========================================
    public function me(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        if ($user->role === 'teknisi') {
            $this->checkTechnicianAchievements($user);
        } elseif ($user->role === 'koordinator') {
            $this->checkKoordinatorAchievements($user);
        }

        if ($user->role === 'teknisi') {
            $totalAnalisis = DB::table('bookings')->where('status', 'selesai')->count();
            $statsKey = 'total_orders';
        } elseif ($user->role === 'koordinator') {
            $totalAnalisis = DB::table('bookings')->whereIn('status', ['ditandatangani', 'selesai'])->count();
            $statsKey = 'total_verifikasi';
        } else {
            $totalAnalisis = DB::table('bookings')->where('user_id', $user->id)->count();
            $statsKey = 'total_orders';
        }

        $totalLogin = $user->login_count;
        $totalAchievements = DB::table('user_achievements')->where('user_id', $user->id)->count();

        $myAchievements = DB::table('user_achievements')
            ->join('achievements', 'user_achievements.achievement_id', '=', 'achievements.id')
            ->where('user_achievements.user_id', $user->id)
            ->select('achievements.name', 'achievements.description', 'achievements.type')
            ->get();

        // Solusi URL Manual anti-error method url()
        $user->avatar_url = null;
        if ($user->avatar) {
            $user->avatar_url = "https://" . config('filesystems.disks.s3.bucket') . ".s3." . config('filesystems.disks.s3.region') . ".amazonaws.com/" . $user->avatar;
        }

        return response()->json([
            'user' => $user,
            'stats' => [
                $statsKey => $totalAnalisis,
                'total_login' => $totalLogin,
                'total_achievements' => $totalAchievements
            ],
            'achievements_list' => $myAchievements
        ]);
    }

    // ==========================================
    // 4. UPDATE PROFILE
    // ==========================================
    public function updateProfile(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $request->validate([
            'name' => [
                'required', 'string', 'max:255',
                Rule::unique('users')->ignore($user->id)
            ],
            'full_name' => ['required', 'string', 'max:255'],
            'email' => [
                'required', 'email', 'max:255',
                Rule::unique('users')->ignore($user->id)
            ],
            'institusi' => 'required|string',
            'nomor_telpon' => 'required|string|max:20',
            'bio' => 'nullable|string|max:500',
            'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:1024',
        ]);

        try {
            if ($request->hasFile('avatar')) {
                $file = $request->file('avatar');

                if (!$file->isValid()) {
                    return response()->json([
                        'message' => 'File avatar tidak valid atau upload gagal.',
                        'errors' => ['avatar' => ['The avatar failed to upload.']]
                    ], 422);
                }

                // Tambahkan Type Hinting agar IDE tahu ini adalah FilesystemAdapter
                /** @var \Illuminate\Filesystem\FilesystemAdapter $s3Disk */
                $s3Disk = Storage::disk('s3');

                if ($user->avatar && $s3Disk->exists($user->avatar)) {
                    $s3Disk->delete($user->avatar);
                }

                $path = $s3Disk->putFile('avatars', $file);

                if (!$path) {
                    return response()->json([
                        'message' => 'Gagal menyimpan avatar ke cloud storage.',
                        'errors' => ['avatar' => ['Failed to save avatar to S3.']]
                    ], 500);
                }

                $user->avatar = $path;
            }

            $user->name = $request->name;
            $user->full_name = $request->full_name;
            $user->email = $request->email;
            $user->institusi = $request->institusi;
            $user->nomor_telpon = $request->nomor_telpon;
            $user->bio = $request->bio;
            $user->save();

            $this->checkTechnicianAchievements($user);

            // Bangun kembali URL baru secara manual
            $newAvatarUrl = null;
            if ($user->avatar) {
                $newAvatarUrl = "https://" . config('filesystems.disks.s3.bucket') . ".s3." . config('filesystems.disks.s3.region') . ".amazonaws.com/" . $user->avatar;
            }

            return response()->json([
                'message' => 'Profil berhasil diperbarui!',
                'user' => $user,
                'avatar_url' => $newAvatarUrl
            ]);

        } catch (\Exception $e) {
            Log::error('Update Profile Error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Terjadi kesalahan saat update profil.',
                'errors' => ['avatar' => [$e->getMessage()]]
            ], 500);
        }
    }

    // ==========================================
    // 5. HELPER ACHIEVEMENTS LOGIC
    // ==========================================
    private function checkTechnicianAchievements($user)
    {
        if ($user->role !== 'teknisi') return;

        $loginAchievements = DB::table('achievements')
            ->where('role', 'teknisi')
            ->where('type', 'login')
            ->where('target', '<=', $user->login_count)
            ->get();

        foreach ($loginAchievements as $achievement) {
            $exists = DB::table('user_achievements')
                ->where('user_id', $user->id)
                ->where('achievement_id', $achievement->id)
                ->exists();

            if (!$exists) {
                DB::table('user_achievements')->insert([
                    'user_id' => $user->id,
                    'achievement_id' => $achievement->id,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }
        }

        $analysisCount = DB::table('bookings')->where('status', 'selesai')->count();
        $analysisAchievements = DB::table('achievements')
            ->where('role', 'teknisi')
            ->where('type', 'analysis')
            ->where('target', '<=', $analysisCount)
            ->get();

        foreach ($analysisAchievements as $achievement) {
            $exists = DB::table('user_achievements')
                ->where('user_id', $user->id)
                ->where('achievement_id', $achievement->id)
                ->exists();

            if (!$exists) {
                DB::table('user_achievements')->insert([
                    'user_id' => $user->id,
                    'achievement_id' => $achievement->id,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }
        }
    }

    private function checkKoordinatorAchievements($user)
    {
        if ($user->role !== 'koordinator') return;

        $loginAchievements = DB::table('achievements')
            ->where('role', 'koordinator')
            ->where('type', 'login')
            ->where('target', '<=', $user->login_count)
            ->get();

        foreach ($loginAchievements as $achievement) {
            $exists = DB::table('user_achievements')
                ->where('user_id', $user->id)
                ->where('achievement_id', $achievement->id)
                ->exists();

            if (!$exists) {
                DB::table('user_achievements')->insert([
                    'user_id' => $user->id,
                    'achievement_id' => $achievement->id,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }
        }

        $verifikasiCount = DB::table('bookings')->whereIn('status', ['ditandatangani', 'selesai'])->count();
        $verifikasiAchievements = DB::table('achievements')
            ->where('role', 'koordinator')
            ->where('type', 'verifikasi')
            ->where('target', '<=', $verifikasiCount)
            ->get();

        foreach ($verifikasiAchievements as $achievement) {
            $exists = DB::table('user_achievements')
                ->where('user_id', $user->id)
                ->where('achievement_id', $achievement->id)
                ->exists();

            if (!$exists) {
                DB::table('user_achievements')->insert([
                    'user_id' => $user->id,
                    'achievement_id' => $achievement->id,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }
        }
    }

    private function checkLoginAchievements($user)
    {
        $achievements = DB::table('achievements')
            ->where('type', 'login')
            ->where('target', '<=', $user->login_count)
            ->where(function($query) use ($user) {
                $query->whereNull('role')
                      ->orWhere('role', 'klien')
                      ->orWhere('role', $user->role);
            })
            ->get();

        foreach ($achievements as $achievement) {
            if ($achievement->role === 'teknisi' && $user->role !== 'teknisi') {
                continue;
            }
            if (($achievement->role === 'klien' || $achievement->role === null) && $user->role === 'teknisi') {
                continue;
            }

            $exists = DB::table('user_achievements')
                ->where('user_id', $user->id)
                ->where('achievement_id', $achievement->id)
                ->exists();

            if (!$exists) {
                DB::table('user_achievements')->insert([
                    'user_id' => $user->id,
                    'achievement_id' => $achievement->id,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }
        }
    }
}
