<?php
require __DIR__ . '/../backend/vendor/autoload.php';

use Carbon\Carbon;

// Mock current time: Now in IST is 2026-11-05 02:00:00 (which is 2026-11-04 20:30:00 UTC)
Carbon::setTestNow(Carbon::parse('2026-11-04 20:30:00', 'UTC'));

// Record from yesterday 11:00 PM IST (2026-11-04 17:30:00 UTC)
$recYesterday = '2026-11-04 17:30:00';
$parsedYesterday = Carbon::parse($recYesterday)->setTimezone('Asia/Kolkata');
echo "Yesterday parsed: " . $parsedYesterday->toIso8601String() . "\n";
echo "Yesterday isToday(): " . ($parsedYesterday->isToday() ? 'TRUE' : 'FALSE') . "\n";

// Record from today 01:30 AM IST (2026-11-04 20:00:00 UTC)
$recToday = '2026-11-04 20:00:00';
$parsedToday = Carbon::parse($recToday)->setTimezone('Asia/Kolkata');
echo "Today parsed: " . $parsedToday->toIso8601String() . "\n";
echo "Today isToday(): " . ($parsedToday->isToday() ? 'TRUE' : 'FALSE') . "\n";
