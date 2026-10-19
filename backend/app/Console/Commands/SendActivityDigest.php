<?php

namespace App\Console\Commands;

use App\Mail\ActivityDigestMail;
use App\Models\BoardNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendActivityDigest extends Command
{
    protected $signature = 'notifications:send-digest';

    protected $description = 'Kirim email ringkasan aktivitas board yang belum diemail (satu email per anggota).';

    public function handle(): int
    {
        $pending = BoardNotification::with(['actor:id,username,fullname', 'board:id,name', 'recipient'])
            ->whereNull('emailed_at')
            ->orderBy('id')
            ->get();

        if ($pending->isEmpty()) {
            return self::SUCCESS;
        }

        $sent = 0;

        foreach ($pending->groupBy('recipient_id') as $items) {
            $recipient = $items->first()->recipient;

            // Satu pengiriman gagal tidak boleh menghentikan anggota lain.
            try {
                if ($recipient && $recipient->email) {
                    $byBoard = $items->groupBy(fn ($n) => $n->board->name ?? 'Board');

                    Mail::to($recipient->email)->send(
                        new ActivityDigestMail($recipient, $byBoard, $items->count())
                    );

                    $sent++;
                }

                BoardNotification::whereIn('id', $items->pluck('id'))
                    ->update(['emailed_at' => now()]);
            } catch (\Throwable $e) {
                Log::error('Gagal kirim digest ke user ' . $items->first()->recipient_id . ': ' . $e->getMessage());
            }
        }

        $this->info("Digest terkirim ke {$sent} anggota.");

        return self::SUCCESS;
    }
}
