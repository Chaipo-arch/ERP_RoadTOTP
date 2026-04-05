<?php

namespace App\Mail;

use App\Models\Invitation;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class InvitationMail extends Mailable
{
    use Queueable, SerializesModels;

    public Invitation $invitation;
    public string $setupUrl;

    public function __construct(Invitation $invitation)
    {
        $this->invitation = $invitation;

        // Build the frontend URL for password setup
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
        $this->setupUrl = $frontendUrl . '/setup-password?token=' . $invitation->token . '&email=' . urlencode($invitation->email);
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Invitation à rejoindre ' . config('app.name'),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.invitation',
        );
    }
}
