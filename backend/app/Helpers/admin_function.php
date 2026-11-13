<?php

use App\Models\CommissionSetting;
use App\Models\DirectIncome;
use App\Models\LevelIncome;
use App\Models\TotalLevelIncome;
use App\Models\User;
use App\Models\WalletTransfer;

/**
 * Distribute Direct Income to sponsor with order and payment references
 */
function directIncome($sponsorid, $memberid, $amount, $dumpAmount = 0, $orderId = null, $salePaymentId = null, $sourceUserCode = null, $percentage = null)
{
    // 1. Root check
    if (empty($sponsorid) || strtolower(trim((string) $sponsorid)) === 'root') {
        return null;
    }

    // A member cannot sponsor themselves
    if (!empty($memberid) && trim((string) $sponsorid) === trim((string) $memberid)) {
        return null;
    }

    $amount = round((float) $amount, 2);
    if ($amount <= 0) {
        return null;
    }

    // 2. Find sponsor in users table
    $sponsor = User::where('user_code', $sponsorid)
        ->orWhere('id', $sponsorid)
        ->first();

    if (!$sponsor) {
        return null;
    }

    // 3 & 4. Save into direct_incomes table with order/payment traceability
    $direct = new DirectIncome();
    $direct->order_id = $orderId ? (int) $orderId : null;
    $direct->sale_payment_id = $salePaymentId ? (int) $salePaymentId : null;
    $direct->source_user_code = $sourceUserCode ?: (!empty($memberid) ? (string) $memberid : null);
    $direct->percentage = $percentage !== null ? (float) $percentage : null;
    $direct->user_code = $sponsor->user_code;
    $direct->sponsor_id = $sponsor->sponsor_id ?? 'Root';
    $direct->total_amount = $amount;
    $direct->paid_amount = $amount;
    $direct->balance_amount = 0.00;
    $direct->dump_amount = 0.00; // Bug 2 Fix: Direct incomes must not replicate order dump amount
    $direct->save();

    // 5. Update sponsor wallet balance
    $oldWallet = (float) $sponsor->commission_balance;
    $newWallet = round($oldWallet + $amount, 2);
    $sponsor->commission_balance = $newWallet;
    $sponsor->save();

    // 6 & 7. Record transaction in wallet_transfers
    walletTransfer(
        $sponsor->user_code,
        $amount,
        'credit',
        $newWallet,
        'Direct Income',
        'Direct Income credited to wallet. Payment Record #' . $direct->id
    );

    return $direct;
}

function levelIncome(
    $buyerUserCode,
    $levelIncomePool,
    $dumpAmount = 0,
    $paymentType = 'advance',
    $orderId = null,
    $invoiceNumber = null,
    $paymentId = null,
    $isNewProject = null,
    ?array $perLevelAmounts = null
) {
    $levelIncomePool = round((float) $levelIncomePool, 2);
    if ($levelIncomePool <= 0 || empty($buyerUserCode)) {
        return [];
    }

    // Normalize parameters if paymentType is passed as orderId or array
    if (is_numeric($paymentType) && $orderId === null) {
        $orderId = (int) $paymentType;
        $paymentType = 'advance';
    } elseif (is_array($paymentType)) {
        $options = $paymentType;
        $paymentType = $options['payment_type'] ?? 'advance';
        $orderId = $options['order_id'] ?? $orderId;
        $invoiceNumber = $options['invoice_number'] ?? $invoiceNumber;
        $paymentId = $options['payment_id'] ?? $paymentId;
        $isNewProject = $options['is_new_project'] ?? $isNewProject;
    }
    $paymentType = !empty($paymentType) ? (string) $paymentType : 'advance';

    // 1. Find the buyer
    $buyer = User::where('user_code', $buyerUserCode)
        ->orWhere('id', $buyerUserCode)
        ->first();

    if (!$buyer) {
        return [];
    }

    // 2. Resolve per-level payout amounts dynamically from the active Global Commission Settings snapshot
    if ($perLevelAmounts === null) {
        $configSnapshot = CommissionSetting::getValidatedGlobalSnapshot();
        $totalLevelPercent = (float) $configSnapshot['level_total_percent'];
        if ($totalLevelPercent <= 0) {
            return [];
        }

        $perLevelAmounts = [];
        foreach ($configSnapshot['levels'] as $lvl) {
            $lvlNum = (int) $lvl['level'];
            $lvlPct = (float) $lvl['percent'];
            $perLevelAmounts[$lvlNum] = $lvlPct > 0
                ? round($levelIncomePool * ($lvlPct / $totalLevelPercent), 2)
                : 0.0;
        }
    }

    $maxLevel = !empty($perLevelAmounts) ? (int) max(array_keys($perLevelAmounts)) : 0;
    if ($maxLevel <= 0) {
        return [];
    }

    $distributed = [];
    $currSponsorCode = $buyer->sponsor_id;

    // 3. Walk dynamically across all configured upline levels (1..N)
    for ($level = 1; $level <= $maxLevel; $level++) {
        // Stop if sponsor is Root, empty, or null
        if (empty($currSponsorCode) || strtolower(trim((string) $currSponsorCode)) === 'root') {
            break;
        }

        // Find upline user
        $upline = User::where('user_code', $currSponsorCode)
            ->orWhere('id', $currSponsorCode)
            ->first();

        if (!$upline) {
            break;
        }

        $incomeAmount = round((float) ($perLevelAmounts[$level] ?? 0.0), 2);

            if ($incomeAmount > 0) {
                // Rule: If this is the same project, find and update the existing total_level_incomes record.
                // If it is a new project arriving from an entity, create a new total_level_incomes record.
                $existingTLI = null;

                if ($isNewProject !== true) {
                    if ($orderId !== null) {
                        $existingTLI = TotalLevelIncome::where('order_id', $orderId)
                            ->where('user_code', $upline->user_code)
                            ->where('level', $level)
                            ->first();
                    }

                    if (!$existingTLI && $invoiceNumber !== null) {
                        $existingTLI = TotalLevelIncome::where('invoice_number', $invoiceNumber)
                            ->where('user_code', $upline->user_code)
                            ->where('level', $level)
                            ->first();
                    }

                    // Fallback for same project without order_id: check if balance payment or explicitly not new
                    if (!$existingTLI && (strtolower(trim($paymentType)) === 'balance' || $isNewProject === false)) {
                        $existingTLI = TotalLevelIncome::where('user_code', $upline->user_code)
                            ->where('level_id', $buyer->user_code ?: (string) $buyerUserCode)
                            ->where('level', $level)
                            ->latest('id')
                            ->first();
                    }
                }

                if ($existingTLI) {
                    // Update existing project's total_level_incomes record
                    $existingTLI->total_amount = round((float) $existingTLI->total_amount + $incomeAmount, 2);
                    $existingTLI->paid_amount = round((float) $existingTLI->paid_amount + $incomeAmount, 2);
                    $existingTLI->payment_type = $paymentType;
                    if ($orderId !== null && empty($existingTLI->order_id)) {
                        $existingTLI->order_id = $orderId;
                    }
                    if ($invoiceNumber !== null && empty($existingTLI->invoice_number)) {
                        $existingTLI->invoice_number = $invoiceNumber;
                    }
                    $existingTLI->save();
                    $totalLevelRecord = $existingTLI;
                } else {
                    // Create new total_level_incomes record for new project from entity
                    $totalLevelRecord = new TotalLevelIncome();
                    if ($orderId !== null) {
                        $totalLevelRecord->order_id = $orderId;
                    }
                    if ($invoiceNumber !== null) {
                        $totalLevelRecord->invoice_number = $invoiceNumber;
                    }
                    $totalLevelRecord->user_code = $upline->user_code;
                    $totalLevelRecord->level_id = $buyer->user_code ?: (string) $buyerUserCode;
                    $totalLevelRecord->level = (string) $level;
                    $totalLevelRecord->payment_type = $paymentType;
                    $totalLevelRecord->total_amount = $incomeAmount;
                    $totalLevelRecord->paid_amount = $incomeAmount;
                    $totalLevelRecord->balance_amount = 0.00;
                    $totalLevelRecord->dump_amount = 0.00;
                    $totalLevelRecord->save();
                }

                // 2. Insert distribution record into level_incomes table with the correct amount
                $distributionRecord = new LevelIncome();
                $distributionRecord->user_code = $upline->user_code;
                $distributionRecord->level_id = $buyer->user_code ?: (string) $buyerUserCode;
                $distributionRecord->level = $level;
                $distributionRecord->payment_type = $paymentType;
                $distributionRecord->amount = $incomeAmount;
                if ($orderId !== null) {
                    $distributionRecord->order_id = $orderId;
                }
                if ($invoiceNumber !== null) {
                    $distributionRecord->invoice_number = $invoiceNumber;
                }
                if ($paymentId !== null) {
                    $distributionRecord->payment_id = $paymentId;
                }
                $distributionRecord->save();

                // 3. Update recipient wallet balance
                $oldWallet = (float) $upline->commission_balance;
                $newWallet = round($oldWallet + $incomeAmount, 2);
                $upline->commission_balance = $newWallet;
                $upline->save();

                // 4. Record in wallet_transfers
                walletTransfer(
                    $upline->user_code,
                    $incomeAmount,
                    'credit',
                    $newWallet,
                    'Level Income',
                    "Level {$level} Income credited from member {$buyer->user_code}. Record #{$totalLevelRecord->id}"
                );

                $distributed[] = $totalLevelRecord;
            }

        // Move to next sponsor in upline
        $currSponsorCode = $upline->sponsor_id;
    }

    return $distributed;
}

/**
 * Update member wallet balance and record transaction
 */
function walletTransfer($memberid, $amount, $type, $wallet, $walletType, $text)
{
    $ins = new WalletTransfer();
    $ins->memberid = $memberid;
    $ins->walletType = $walletType;
    if ($type === 'debit') {
        $ins->credit = 0.00;
        $ins->debit = (float) $amount;
        $ins->balance = round((float) $wallet - (float) $amount, 2);
    } else {
        $ins->credit = (float) $amount;
        $ins->debit = 0.00;
        $ins->balance = (float) $wallet;
    }
    $ins->particular = $text;
    $ins->save();

    return $ins;
}
