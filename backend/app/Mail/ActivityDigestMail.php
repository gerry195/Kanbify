<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Support\Collection;

/**
 * Satu email ringkasan berisi aktivitas yang belum diemail,
 * dikelompokkan per board.
 */
class ActivityDigestMail extends Mailable
{
    /**
     * @param Collection $byBoard  [board_name => Collection<BoardNotification>]
     */
    public function __construct(
        public User $recipient,
        public Collection $byBoard,
        public int $total,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->total === 1
                ? '1 aktivitas baru di Kanbify'
                : "{$this->total} aktivitas baru di Kanbify",
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.activity-digest', with: [
            'appUrl' => rtrim(config('app.frontend_url'), '/'),
        ]);
    }
}
