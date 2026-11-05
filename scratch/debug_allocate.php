<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$admin = App\Models\Admin::first();
if (!$admin) {
    $admin = App\Models\Admin::create([
        'name' => 'Test Admin',
        'email' => 'admin@test.com',
        'password' => bcrypt('password'),
        'role' => 'super_admin',
        'status' => 'active',
    ]);
}

$buyer = App\Models\User::first();
$order = App\Models\Order::create([
    'invoice_number' => 'INV-TEST-' . rand(1000, 9999),
    'date' => now()->toDateString(),
    'entity_name' => 'Vyapar AdNET Entity',
    'customer_name' => $buyer->name,
    'customer_user_code' => $buyer->user_code,
    'item' => 'Test Item',
    'gross_amount' => 50000.00,
    'advance_payment' => 50000.00,
    'balance_due' => 0.00,
    'admin_commission_percent' => 20.00,
    'admin_commission_cut' => 10000.00,
    'approval_status' => 'confirmed',
    'status' => 'completed',
]);

$payment = App\Models\SalePayment::create([
    'sales_record_id' => $order->id,
    'invoice_number' => $order->invoice_number,
    'entity_name' => $order->entity_name,
    'customer_name' => $order->customer_name,
    'customer_user_code' => $order->customer_user_code,
    'amount' => 50000.00,
    'admin_commission_percent' => 20.00,
    'admin_commission_cut' => 10000.00,
    'payment_type' => 'full',
    'income_distribution_status' => 'pending',
]);

$service = app(App\Services\AdminIncomeAllocationService::class);
try {
    $res = $service->allocatePaymentIncome($payment->id, $admin->id);
    echo "SUCCESS!\n";
    print_r($res['allocated']);
} catch (\Throwable $e) {
    echo "EXCEPTION: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
