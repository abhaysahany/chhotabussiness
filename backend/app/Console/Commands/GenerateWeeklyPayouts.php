<?php

namespace App\Console\Commands;

use App\Http\Controllers\UserPayoutController;
use Illuminate\Console\Command;
use Illuminate\Http\Request;

class GenerateWeeklyPayouts extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'payouts:generate-weekly';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate weekly payout requests for all KYC-verified users with balance >= ₹500 and bank details';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Scanning database for KYC-verified users with commission balance >= ₹500...');

        $controller = new UserPayoutController();
        $response = $controller->generateWeeklyBatch(new Request());
        $data = $response->getData(true);

        if (($data['status'] ?? '') === 'success') {
            $count = $data['generated_count'] ?? 0;
            $amount = number_format($data['total_gross_amount'] ?? 0, 2);
            $this->info("✓ Successfully generated {$count} payout requests totaling ₹{$amount}.");
        } else {
            $this->error('Failed: ' . ($data['message'] ?? 'Unknown error'));
        }

        return Command::SUCCESS;
    }
}
