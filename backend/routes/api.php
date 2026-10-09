<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Health & Database Connection Status Check
Route::get('/status', function () {
    try {
        $dbName = DB::connection()->getDatabaseName();
        $pdo = DB::connection()->getPdo();
        $dbStatus = "Connected to database [{$dbName}] successfully!";
        $connected = true;
    } catch (\Exception $e) {
        $dbStatus = "Database connection error: " . $e->getMessage();
        $connected = false;
    }

    return response()->json([
        'status' => 'success',
        'app_name' => config('app.name', 'ChhotaBusiness'),
        'environment' => config('app.env'),
        'database_status' => $dbStatus,
        'database_connected' => $connected,
        'database_name' => $dbName ?? 'N/A',
        'timestamp' => now()->toIso8601String(),
    ]);
});

// Admin Panel API Endpoint
Route::get('/admin/info', function () {
    return response()->json([
        'panel' => 'Admin Panel',
        'message' => 'Welcome to ChhotaBusiness Admin Backend API',
        'stats' => [
            'total_users' => 128,
            'active_orders' => 42,
            'revenue_today' => '$2,450',
            'server_health' => 'Optimal',
        ],
        'features' => ['User Management', 'Analytics', 'System Settings', 'Database Logs'],
    ]);
});

use App\Http\Controllers\UserDashboardController;

// User Panel API Endpoints
Route::get('/user/info', function () {
    return response()->json([
        'panel' => 'User Panel',
        'message' => 'Welcome to ChhotaBusiness Customer Portal API',
        'services' => [
            'Business Setup',
            'GST Registration',
            'Accounting & Bookkeeping',
            'Tax Filing',
        ],
        'support_email' => 'support@chhotabusiness.com',
    ]);
});
Route::get('/user/dashboard-stats', [UserDashboardController::class, 'getDashboardStats']);


use App\Http\Controllers\AuthController;
use App\Http\Controllers\Admin\AdminAuthController;
use App\Http\Controllers\Admin\AdminSupportController;
use App\Http\Controllers\Admin\EntityCategoryController;
use App\Http\Controllers\Admin\BusinessEntityController;
use App\Http\Controllers\Admin\FreelancerEntityController;

// Admin Auth Routes
Route::post('/admin/login', [AdminAuthController::class, 'login']);
Route::post('/admin/forgot-password', [AdminAuthController::class, 'forgotPassword']);
Route::post('/admin/verify-otp', [AdminAuthController::class, 'verifyOtp']);
Route::post('/admin/reset-password', [AdminAuthController::class, 'resetPassword']);

// Public Support Ticket Submission
Route::post('/support/tickets', [AdminSupportController::class, 'store']);
Route::get('/admin/support/tickets', [AdminSupportController::class, 'index']);
Route::get('/admin/support/tickets/{id}', [AdminSupportController::class, 'show']);
Route::post('/admin/support/tickets/{id}/reply', [AdminSupportController::class, 'reply']);
Route::put('/admin/support/tickets/{id}/status', [AdminSupportController::class, 'updateStatus']);

// Business Entity Admin Management Routes
Route::prefix('admin')->group(function () {
    // 1. Entity Categories
    Route::get('/entity-categories', [EntityCategoryController::class, 'index']);
    Route::post('/entity-categories', [EntityCategoryController::class, 'store']);
    Route::get('/entity-categories/{id}', [EntityCategoryController::class, 'show']);
    Route::put('/entity-categories/{id}', [EntityCategoryController::class, 'update']);
    Route::delete('/entity-categories/{id}', [EntityCategoryController::class, 'destroy']);

    // 2. Business Entity Registrations
    Route::get('/business-entities', [BusinessEntityController::class, 'index']);
    Route::post('/business-entities', [BusinessEntityController::class, 'store']);
    Route::get('/business-entities/{id}', [BusinessEntityController::class, 'show']);
    Route::put('/business-entities/{id}', [BusinessEntityController::class, 'update']);
    Route::put('/business-entities/{id}/status', [BusinessEntityController::class, 'updateStatus']);
    Route::delete('/business-entities/{id}', [BusinessEntityController::class, 'destroy']);

    // 3. Freelancer Entity Registrations
    Route::get('/freelancers', [FreelancerEntityController::class, 'index']);
    Route::post('/freelancers', [FreelancerEntityController::class, 'store']);
    Route::get('/freelancers/{id}', [FreelancerEntityController::class, 'show']);
    Route::put('/freelancers/{id}', [FreelancerEntityController::class, 'update']);
    Route::put('/freelancers/{id}/status', [FreelancerEntityController::class, 'updateStatus']);
    Route::delete('/freelancers/{id}', [FreelancerEntityController::class, 'destroy']);
});

// Public Showcase & Advertisement Endpoints for Users
Route::get('/public/categories', [EntityCategoryController::class, 'index']);
Route::get('/public/businesses', [BusinessEntityController::class, 'index']);
Route::get('/public/freelancers', [FreelancerEntityController::class, 'index']);

// Media & Marketing Content Asset Management API Endpoints (MySQL Database Backed)
use App\Http\Controllers\ContentAssetController;
use App\Http\Controllers\SupportTopicController;

Route::get('/content-assets', [ContentAssetController::class, 'index']);
Route::get('/public/content-assets', [ContentAssetController::class, 'index']);
Route::get('/admin/content-assets', [ContentAssetController::class, 'indexAdmin']);
Route::post('/admin/content-assets', [ContentAssetController::class, 'store']);
Route::post('/content-assets', [ContentAssetController::class, 'store']);
Route::put('/admin/content-assets/{id}', [ContentAssetController::class, 'update']);
Route::delete('/admin/content-assets/{id}', [ContentAssetController::class, 'destroy']);
Route::post('/content-assets/{id}/download', [ContentAssetController::class, 'trackDownload']);
Route::get('/content-assets/{id}/download-file', [ContentAssetController::class, 'downloadFile']);
Route::post('/content-assets/{id}/share', [ContentAssetController::class, 'trackShare']);

// Support Videos & Help Articles Management Endpoints (MySQL Database Backed)
Route::get('/support-topics', [SupportTopicController::class, 'index']);
Route::get('/public/support-topics', [SupportTopicController::class, 'index']);
Route::post('/public/support-topics/{id}/view', [SupportTopicController::class, 'incrementView']);
Route::post('/public/support-topics/{id}/helpful', [SupportTopicController::class, 'voteHelpful']);
Route::get('/admin/support-topics', [SupportTopicController::class, 'indexAdmin']);
Route::post('/admin/support-topics', [SupportTopicController::class, 'store']);
Route::get('/admin/support-topics/{id}', [SupportTopicController::class, 'show']);
Route::put('/admin/support-topics/{id}', [SupportTopicController::class, 'update']);
Route::put('/admin/support-topics/{id}/status', [SupportTopicController::class, 'updateStatus']);
Route::delete('/admin/support-topics/{id}', [SupportTopicController::class, 'destroy']);

// Member Network & Genealogy Endpoints (MySQL Database Backed)
use App\Http\Controllers\NetworkController;

Route::get('/user/network/direct', [NetworkController::class, 'getDirectConnections']);
Route::get('/user/network/team', [NetworkController::class, 'getTeamConnections']);
Route::get('/user/network/genealogy', [NetworkController::class, 'getGenealogyTree']);



// Public Auth & Member Verification Routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/auth/social-login', [AuthController::class, 'socialLogin']);
Route::post('/verify-sponsor', [AuthController::class, 'verifySponsor']);
Route::match(['get', 'post'], '/verify-member', [AuthController::class, 'verifyMember']);
Route::post('/send-otp', [AuthController::class, 'sendOtp']);
Route::post('/verify-otp', [AuthController::class, 'verifyOtp']);


// Entity Authentication Routes
use App\Http\Controllers\EntityAuthController;
use App\Http\Controllers\SalesRecordController;

Route::post('/entity/login', [EntityAuthController::class, 'login']);
Route::post('/entity/logout', [EntityAuthController::class, 'logout']);
Route::get('/entity/info', [EntityAuthController::class, 'info']);
Route::post('/entity/forgot-password', [EntityAuthController::class, 'forgotPassword']);
Route::post('/entity/verify-otp', [EntityAuthController::class, 'verifyOtp']);
Route::post('/entity/reset-password', [EntityAuthController::class, 'resetPassword']);

// Central Sales & Payments Management Endpoints (MySQL Database Backed)
Route::get('/sales', [SalesRecordController::class, 'index']);
Route::post('/sales', [SalesRecordController::class, 'store']);
Route::get('/sales/{id}', [SalesRecordController::class, 'show']);
Route::post('/sales/{id}/receive-balance', [SalesRecordController::class, 'receiveBalance']);
Route::post('/sales/{id}/distribute', [SalesRecordController::class, 'distribute']);
Route::get('/payments/history', [SalesRecordController::class, 'paymentsHistory']);
Route::post('/payments/{id}/distribute', [SalesRecordController::class, 'distributePaymentCommission']);
Route::get('/user/business-reports', [SalesRecordController::class, 'userBusinessReports']);

// User Payouts Management Endpoints (MySQL Database Backed)
use App\Http\Controllers\UserPayoutController;
use App\Http\Controllers\RewardController;

Route::get('/admin/payouts', [UserPayoutController::class, 'index']);
Route::post('/admin/payouts/{id}/disburse', [UserPayoutController::class, 'disburse']);
Route::post('/admin/payouts/{id}/reject', [UserPayoutController::class, 'reject']);
Route::post('/admin/payouts/generate-weekly', [UserPayoutController::class, 'generateWeeklyBatch']);
Route::get('/admin/payouts/stats', [UserPayoutController::class, 'stats']);
Route::get('/user/payouts', [UserPayoutController::class, 'getUserPayouts']);
Route::post('/user/payouts/withdraw', [UserPayoutController::class, 'requestWithdrawal']);

// Rewards & Business Points Claims Endpoints (MySQL Database Backed)
Route::get('/admin/rewards', [RewardController::class, 'indexAdmin']);
Route::post('/admin/rewards', [RewardController::class, 'storeReward']);
Route::put('/admin/rewards/{id}', [RewardController::class, 'updateReward']);
Route::delete('/admin/rewards/{id}', [RewardController::class, 'destroyReward']);
Route::get('/admin/reward-claims', [RewardController::class, 'indexClaimsAdmin']);
Route::post('/admin/reward-claims/{id}/status', [RewardController::class, 'updateClaimStatus']);

// User Panel Reward Endpoints
Route::get('/user/rewards', [RewardController::class, 'indexUserRewards']);
Route::get('/user/reward-claims', [RewardController::class, 'indexUserClaims']);
Route::post('/user/rewards/claim', [RewardController::class, 'claimReward']);

// Notification System Endpoints (Targeted & Broadcast)
use App\Http\Controllers\NotificationController;

Route::get('/admin/notifications', [NotificationController::class, 'indexAdmin']);
Route::post('/admin/notifications/send', [NotificationController::class, 'sendNotification']);
Route::get('/user/notifications', [NotificationController::class, 'indexUser']);
Route::post('/user/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
Route::post('/user/notifications/read-all', [NotificationController::class, 'markAllAsRead']);

// Dedicated Admin & Entity Route Aliases
use App\Http\Controllers\AdminDashboardController;

Route::get('/admin/dashboard-stats', [AdminDashboardController::class, 'getDashboardStats']);
Route::get('/admin/sales', [SalesRecordController::class, 'index']);
Route::post('/admin/sales', [SalesRecordController::class, 'store']);

Route::post('/admin/sales/{id}/distribute', [SalesRecordController::class, 'distribute']);
Route::get('/admin/payments/history', [SalesRecordController::class, 'paymentsHistory']);
Route::post('/admin/payments/{id}/distribute', [SalesRecordController::class, 'distributePaymentCommission']);

use App\Http\Controllers\EntityPayoutController;
use App\Http\Controllers\EntityDashboardController;

Route::get('/entity/dashboard-stats', [EntityDashboardController::class, 'getDashboardStats']);
Route::get('/entity/sales', [SalesRecordController::class, 'index']);
Route::post('/entity/sales', [SalesRecordController::class, 'store']);
Route::post('/entity/sales/{id}/receive-balance', [SalesRecordController::class, 'receiveBalance']);
Route::get('/entity/payments/history', [SalesRecordController::class, 'paymentsHistory']);
Route::get('/entity/payouts', [EntityPayoutController::class, 'index']);
Route::get('/entity/payouts/reports', [EntityPayoutController::class, 'reports']);



// Products, Services & Categories MySQL Catalog Endpoints
use App\Http\Controllers\ProductCatalogController;

Route::get('/catalog/products', [ProductCatalogController::class, 'indexProducts']);
Route::post('/catalog/products', [ProductCatalogController::class, 'storeProduct']);
Route::put('/catalog/products/{id}', [ProductCatalogController::class, 'updateProduct']);
Route::delete('/catalog/products/{id}', [ProductCatalogController::class, 'destroyProduct']);

Route::get('/catalog/services', [ProductCatalogController::class, 'indexServices']);
Route::post('/catalog/services', [ProductCatalogController::class, 'storeService']);
Route::put('/catalog/services/{id}', [ProductCatalogController::class, 'updateService']);
Route::delete('/catalog/services/{id}', [ProductCatalogController::class, 'destroyService']);

Route::get('/catalog/categories', [ProductCatalogController::class, 'indexCategories']);
Route::post('/catalog/categories', [ProductCatalogController::class, 'storeCategory']);

Route::get('/catalog/packages', [ProductCatalogController::class, 'indexPackages']);
Route::post('/catalog/packages', [ProductCatalogController::class, 'storePackage']);
Route::put('/catalog/packages/{id}', [ProductCatalogController::class, 'updatePackage']);
Route::delete('/catalog/packages/{id}', [ProductCatalogController::class, 'destroyPackage']);

// System Settings Database Routes
use App\Http\Controllers\SystemSettingController;

Route::get('/settings', [SystemSettingController::class, 'getSettings']);
Route::post('/settings', [SystemSettingController::class, 'saveSettings']);
Route::get('/settings/social-links', [SystemSettingController::class, 'getSocialLinks']);
Route::post('/settings/social-links', [SystemSettingController::class, 'saveSocialLinks']);




use App\Http\Controllers\UserBankKycController;

// User KYC (PAN & Aadhaar only)
Route::post('/user/kyc/submit', [UserBankKycController::class, 'submitKyc']);
Route::post('/user/update-kyc', [UserBankKycController::class, 'submitKyc']);

// User Multiple Bank & UPI Payout Accounts (Only accessible after KYC; requires Email OTP)
Route::get('/user/payout-accounts', [UserBankKycController::class, 'getBankAndUpiAccounts']);
Route::post('/user/send-bank-otp', [UserBankKycController::class, 'sendOtp']);
Route::post('/user/bank-accounts/add', [UserBankKycController::class, 'addBankAccount']);
Route::post('/user/bank-accounts/{id}/delete', [UserBankKycController::class, 'deleteBankAccount']);
Route::post('/user/bank-accounts/{id}/primary', [UserBankKycController::class, 'setPrimaryBankAccount']);
Route::post('/user/upi-accounts/add', [UserBankKycController::class, 'addUpiAccount']);
Route::post('/user/upi-accounts/{id}/delete', [UserBankKycController::class, 'deleteUpiAccount']);
Route::post('/user/upi-accounts/{id}/primary', [UserBankKycController::class, 'setPrimaryUpiAccount']);
// Admin KYC Compliance routes
Route::get('/admin/kyc-requests', [UserBankKycController::class, 'adminIndexKyc']);
Route::post('/admin/kyc/{id}/approve', [UserBankKycController::class, 'adminApproveKyc']);
Route::post('/admin/kyc/{id}/reject', [UserBankKycController::class, 'adminRejectKyc']);

use App\Http\Controllers\SupportTicketController;

// Support Tickets (Database Backed)
Route::get('/user/support-tickets', [SupportTicketController::class, 'getUserTickets']);
Route::post('/user/support-tickets', [SupportTicketController::class, 'createTicket']);
Route::post('/user/support-tickets/{id}/reply', [SupportTicketController::class, 'replyTicket']);
Route::post('/user/support-tickets/{id}/status', [SupportTicketController::class, 'updateStatus']);

Route::get('/admin/support-tickets', [SupportTicketController::class, 'getAdminTickets']);
Route::get('/admin/support/tickets', [SupportTicketController::class, 'getAdminTickets']);
Route::post('/admin/support-tickets/{id}/reply', [SupportTicketController::class, 'replyTicket']);
Route::post('/admin/support/tickets/{id}/reply', [SupportTicketController::class, 'replyTicket']);
Route::post('/admin/support-tickets/{id}/status', [SupportTicketController::class, 'updateStatus']);
Route::put('/admin/support/tickets/{id}/status', [SupportTicketController::class, 'updateStatus']);

// Protected Auth Routes (Sanctum)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/user/update-password', [AuthController::class, 'updatePassword']);
    
    // Protected Entity Routes
    Route::get('/entity/me', [EntityAuthController::class, 'me']);

    // Protected Admin Routes
    Route::get('/admin/me', [AdminAuthController::class, 'me']);
    Route::post('/admin/logout', [AdminAuthController::class, 'logout']);
});






