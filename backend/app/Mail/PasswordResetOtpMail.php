<?php

namespace App\Mail;

use App\Services\EmailTemplateRenderer;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PasswordResetOtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $recipientName;
    public string $otp;
    public string $accountType;
    public int $expiresInMinutes;

    /**
     * Create a new message instance.
     *
     * @param string $recipientName Display name of the user or business
     * @param string $otp 6-digit numeric OTP code
     * @param string $accountType Account role label (Administrator, Business Entity, Freelancer, Member)
     * @param int $expiresInMinutes Validity duration in minutes (default 15)
     */
    public function __construct(
        string $recipientName,
        string $otp,
        string $accountType = 'Member',
        int $expiresInMinutes = 15
    ) {
        $this->recipientName = $recipientName;
        $this->otp = $otp;
        $this->accountType = $accountType;
        $this->expiresInMinutes = $expiresInMinutes;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '[Vyapar AdNET] Password Reset Verification Code',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $html = EmailTemplateRenderer::render('password-reset-otp', [
            'recipientName' => $this->recipientName,
            'otp' => $this->otp,
            'accountType' => $this->accountType,
            'expiresInMinutes' => $this->expiresInMinutes,
        ]);

        return new Content(
            htmlString: $html,
        );
    }

    /**
     * Build the message with inline CID logo attachment when enabled.
     */
    public function build()
    {
        if (EmailTemplateRenderer::shouldEmbedLogo()) {
            $this->withSymfonyMessage(function ($message) {
                $logoPath = EmailTemplateRenderer::getLogoPath();
                if (file_exists($logoPath)) {
                    $message->embedFromPath($logoPath, 'logo-email.png', 'image/png');
                }
            });
        }

        return $this;
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
