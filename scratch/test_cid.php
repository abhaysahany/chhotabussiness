<?php
require __DIR__ . '/../backend/vendor/autoload.php';

use Symfony\Component\Mime\Email;

$email = new Email();
$email->embedFromPath(__DIR__ . '/../backend/public/images/logo-email.png', 'logo-email.png', 'image/png');

echo "Symfony Embed test:\n";
foreach ($email->getAttachments() as $part) {
    echo "Filename: " . $part->getFilename() . "\n";
    echo "Media-type: " . $part->getMediaType() . "/" . $part->getMediaSubtype() . "\n";
    echo "Disposition: " . $part->getDisposition() . "\n";
    $headers = $part->getPreparedHeaders();
    echo "Content-ID header: " . ($headers->get('Content-ID') ? $headers->get('Content-ID')->getBodyAsString() : 'none') . "\n";
}
