<?php

use App\Models\DirectIncome;
use App\Models\LevelIncome;
use App\Models\User;
use App\Models\WalletTransfer;

/**
 * Distribute Direct Income to sponsor
 */
function directIncome($sponsorid, $memberid, $amount, $dumpAmount = 0)
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

    // 3 & 4. Save into direct_incomes table
    $direct = new DirectIncome();
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

function levelIncome($buyerUserCode, $levelIncomePool, $dumpAmount = 0)
{
    $levelIncomePool = round((float) $levelIncomePool, 2);
    if ($levelIncomePool <= 0 || empty($buyerUserCode)) {
        return [];
    }

    // 1. Find the buyer
    $buyer = User::where('user_code', $buyerUserCode)
        ->orWhere('id', $buyerUserCode)
        ->first();

    if (!$buyer) {
        return [];
    }

    // 2. Level percentages: Level 2 = 40%, Level 3 = 30%, Level 4 = 20%, Level 5 = 10%
    $percentages = [
        2 => 0.40,
        3 => 0.30,
        4 => 0.20,
        5 => 0.10,
    ];

    $distributed = [];
    $currSponsorCode = $buyer->sponsor_id;

    // 3. For loop through upline levels 1 to 5
    for ($level = 1; $level <= 5; $level++) {
        // Stop if sponsor is Root, empty, or null
        if (empty($currSponsorCode) || strtolower(trim((string) $currSponsorCode)) === 'Root') {
            break;
        }

        // Find upline user
        $upline = User::where('user_code', $currSponsorCode)
            ->orWhere('id', $currSponsorCode)
            ->first();

        if (!$upline) {
            break;
        }

        // Level 1 receives Direct Income, NOT Level Income (Level 1 skipped)
        if ($level >= 2 && $level <= 5) {
            $rate = $percentages[$level];
            $incomeAmount = round($levelIncomePool * $rate, 2);

            if ($incomeAmount > 0) {
                // Save record in level_incomes table
                $record = new LevelIncome();
                $record->user_code = $upline->user_code;
                $record->level_id = $buyer->user_code ?: (string) $buyerUserCode;
                $record->level = $level;
                $record->total_amount = $incomeAmount;
                $record->paid_amount = $incomeAmount;
                $record->balance_amount = 0.00;
                $record->dump_amount = 0.00; // Bug 2 Fix: Level incomes must not replicate order dump amount
                $record->save();

                // Update recipient wallet balance
                $oldWallet = (float) $upline->commission_balance;
                $newWallet = round($oldWallet + $incomeAmount, 2);
                $upline->commission_balance = $newWallet;
                $upline->save();

                // Record in wallet_transfers
                walletTransfer(
                    $upline->user_code,
                    $incomeAmount,
                    'credit',
                    $newWallet,
                    'Level Income',
                    "Level {$level} Income credited from member {$buyer->user_code}. Record #{$record->id}"
                );

                $distributed[] = $record;
            }
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
