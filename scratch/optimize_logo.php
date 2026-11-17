<?php
$srcFile = __DIR__ . '/../backend/public/logo.png';
$destFile = __DIR__ . '/../backend/public/images/logo-email.png';

$src = imagecreatefrompng($srcFile);
$w = imagesx($src);
$h = imagesy($src);

$dst = imagecreatetruecolor(280, 280);
imagealphablending($dst, false);
imagesavealpha($dst, true);
$transparent = imagecolorallocatealpha($dst, 0, 0, 0, 127);
imagefilledrectangle($dst, 0, 0, 280, 280, $transparent);

imagecopyresampled($dst, $src, 0, 0, 0, 0, 280, 280, $w, $h);

// PNG compression 9, full filtering
imagepng($dst, $destFile, 9, PNG_ALL_FILTERS);

imagedestroy($src);
imagedestroy($dst);

$bytes = filesize($destFile);
$kb = round($bytes / 1024, 2);

echo "PHP GD RESIZE COMPLETE\n";
echo "Destination: {$destFile}\n";
echo "Size: {$bytes} bytes ({$kb} KB)\n";

// Also copy to user/public/images/logo-email.png so frontend public root also has it
$userImagesDir = __DIR__ . '/../user/public/images';
if (!is_dir($userImagesDir)) {
    mkdir($userImagesDir, 0755, true);
}
copy($destFile, $userImagesDir . '/logo-email.png');
echo "Mirrored to: {$userImagesDir}/logo-email.png\n";
