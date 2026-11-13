<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Models\BusinessEntity;
use App\Models\FreelancerEntity;
use App\Models\User;

$report = [];

// 1. All Business Entities and matching Users
$businesses = BusinessEntity::select('id', 'name', 'email', 'phone', 'created_at')->get();
$bizAudit = [];
foreach ($businesses as $b) {
    $matchedUser = User::where('email', $b->email)->select('id', 'user_code', 'email', 'name', 'rank', 'created_at')->first();
    $bizAudit[] = [
        'business_id' => $b->id,
        'business_name' => $b->name,
        'business_email' => $b->email,
        'business_created_at' => $b->created_at ? $b->created_at->toIso8601String() : null,
        'matched_user' => $matchedUser ? [
            'user_id' => $matchedUser->id,
            'user_code' => $matchedUser->user_code,
            'user_created_at' => $matchedUser->created_at ? $matchedUser->created_at->toIso8601String() : null,
            'time_diff_seconds' => ($b->created_at && $matchedUser->created_at) ? abs($b->created_at->timestamp - $matchedUser->created_at->timestamp) : null,
        ] : null,
    ];
}
$report['business_entities_count'] = $businesses->count();
$report['businesses'] = $bizAudit;

// 2. All Freelancer Entities and matching Users
$freelancers = FreelancerEntity::select('id', 'name', 'email', 'phone', 'created_at')->get();
$flAudit = [];
foreach ($freelancers as $f) {
    $matchedUser = User::where('email', $f->email)->select('id', 'user_code', 'email', 'name', 'rank', 'created_at')->first();
    $flAudit[] = [
        'freelancer_id' => $f->id,
        'freelancer_name' => $f->name,
        'freelancer_email' => $f->email,
        'freelancer_created_at' => $f->created_at ? $f->created_at->toIso8601String() : null,
        'matched_user' => $matchedUser ? [
            'user_id' => $matchedUser->id,
            'user_code' => $matchedUser->user_code,
            'user_created_at' => $matchedUser->created_at ? $matchedUser->created_at->toIso8601String() : null,
            'time_diff_seconds' => ($f->created_at && $matchedUser->created_at) ? abs($f->created_at->timestamp - $matchedUser->created_at->timestamp) : null,
        ] : null,
    ];
}
$report['freelancers_count'] = $freelancers->count();
$report['freelancers'] = $flAudit;

// 3. Check if any of these matched users have MLM network activity: orders as customer, sponsor, direct income, level income, payouts
$matchedUserIds = [];
foreach ($bizAudit as $b) {
    if ($b['matched_user']) $matchedUserIds[] = $b['matched_user']['user_id'];
}
foreach ($flAudit as $f) {
    if ($f['matched_user']) $matchedUserIds[] = $f['matched_user']['user_id'];
}
$matchedUserIds = array_unique($matchedUserIds);

$networkActivity = [];
foreach ($matchedUserIds as $uid) {
    $u = User::find($uid);
    if (!$u) continue;
    $ordersAsCustomer = DB::table('orders')->where('customer_user_code', $u->user_code)->count();
    $ordersAsSponsor = DB::table('orders')->where('sponsor', $u->user_code)->count();
    $directIncomes = DB::table('direct_incomes')->where('user_code', $u->user_code)->count();
    $levelIncomes = DB::table('level_incomes')->where('user_code', $u->user_code)->count();
    $payouts = DB::table('user_payouts')->where('user_id', $uid)->orWhere('user_code', $u->user_code)->count();
    $tokens = DB::table('personal_access_tokens')->where('tokenable_type', 'App\Models\User')->where('tokenable_id', $uid)->count();
    
    $networkActivity[$uid] = [
        'user_id' => $uid,
        'user_code' => $u->user_code,
        'email' => $u->email,
        'tokens_count' => $tokens,
        'orders_as_customer' => $ordersAsCustomer,
        'orders_as_sponsor' => $ordersAsSponsor,
        'direct_incomes' => $directIncomes,
        'level_incomes' => $levelIncomes,
        'payouts' => $payouts,
    ];
}
$report['matched_users_activity'] = $networkActivity;

echo json_encode($report, JSON_PRETTY_PRINT);
