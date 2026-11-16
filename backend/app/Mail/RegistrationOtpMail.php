<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RegistrationOtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $recipientName;
    public string $otp;
    public int $expiresInMinutes;

    /**
     * Create a new message instance.
     *
     * @param string $recipientName Full Name or Business Name of the registrant
     * @param string $otp 6-digit numeric OTP code
     * @param int $expiresInMinutes Validity duration in minutes (default 10)
     */
    public function __construct(
        string $recipientName,
        string $otp,
        int $expiresInMinutes = 10
    ) {
        $this->recipientName = $recipientName;
        $this->otp = $otp;
        $this->expiresInMinutes = $expiresInMinutes;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Verify Your Vyapar AdNET Email Address',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.registration-otp',
            with: [
                'recipientName' => $this->recipientName,
                'otp' => $this->otp,
                'expiresInMinutes' => $this->expiresInMinutes,
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
