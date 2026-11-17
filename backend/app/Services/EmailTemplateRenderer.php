<?php

namespace App\Services;

class EmailTemplateRenderer
{
    /**
     * Render a compiled React Email template with safe dynamic placeholder substitution.
     *
     * @param string $templateName Template file name without extension (e.g., 'registration-otp')
     * @param array $data Dynamic variables to inject into the template
     * @return string Final email-ready HTML
     * @throws \RuntimeException If the compiled React Email template file is missing
     */
    public static function render(string $templateName, array $data = []): string
    {
        $primaryPath = resource_path("views/emails/compiled/{$templateName}.html");
        $fallbackPath = base_path("email-templates/dist/{$templateName}.html");

        if (file_exists($primaryPath)) {
            $html = file_get_contents($primaryPath);
        } elseif (file_exists($fallbackPath)) {
            $html = file_get_contents($fallbackPath);
        } else {
            throw new \RuntimeException(
                "Compiled React Email template [{$templateName}] was not found at [{$primaryPath}] or [{$fallbackPath}]. " .
                "Please run 'npm run build' inside backend/email-templates/ to compile the React Email templates."
            );
        }

        // HTML-escape dynamic text variables to prevent XSS / markup breakage
        $recipientName = htmlspecialchars((string) ($data['recipientName'] ?? 'Valued Partner'), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $accountType = htmlspecialchars((string) ($data['accountType'] ?? 'Member'), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $otp = trim((string) ($data['otp'] ?? ''));
        $expiresInMinutes = (string) ($data['expiresInMinutes'] ?? '10');
        $currentYear = (string) ($data['currentYear'] ?? date('Y'));

        // Logo URL resolution:
        // 1. Explicitly passed logoUrl (e.g., from local preview or test)
        // 2. If inline CID embedding is enabled and available: 'cid:logo-email.png'
        // 3. Configured public HTTPS URL (fallback to official production asset)
        $shouldEmbed = config('mail.embed_logo', true);
        $localLogoPath = public_path('images/logo-email.png');

        if (!empty($data['logoUrl'])) {
            $logoUrl = $data['logoUrl'];
        } elseif ($shouldEmbed && file_exists($localLogoPath)) {
            $logoUrl = 'cid:logo-email.png';
        } else {
            $logoUrl = config('mail.logo_url', env('MAIL_LOGO_URL', 'https://vyaparadnet.com/images/logo-email.png'));
        }

        $html = str_replace('<!-- -->', '', $html);

        $replacements = [
            '{{RECIPIENT_NAME}}' => $recipientName,
            '{{OTP_CODE}}' => $otp,
            '{{EXPIRY_MINUTES}}' => $expiresInMinutes,
            '{{ACCOUNT_TYPE}}' => $accountType,
            '{{ACCOUNT_TYPE_UPPER}}' => strtoupper($accountType),
            '{{CURRENT_YEAR}}' => $currentYear,
            '{{LOGO_URL}}' => $logoUrl,
        ];

        return strtr($html, $replacements);
    }

    /**
     * Determine whether the Mailable should attach the logo as an inline CID part.
     */
    public static function shouldEmbedLogo(?string $customLogoUrl = null): bool
    {
        if (!empty($customLogoUrl) && !str_starts_with($customLogoUrl, 'cid:')) {
            return false;
        }

        return config('mail.embed_logo', true) && file_exists(public_path('images/logo-email.png'));
    }

    /**
     * Get the absolute filesystem path to the email logo asset.
     */
    public static function getLogoPath(): string
    {
        return public_path('images/logo-email.png');
    }
}
