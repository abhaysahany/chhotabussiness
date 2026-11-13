<?php

namespace App\Services;

use App\Models\DiamondRewardAudit;
use App\Models\DiamondTransaction;
use App\Models\DiamondWallet;
use App\Models\Order;
use App\Models\SalePayment;
use App\Models\User;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class DiamondRewardService
{
    public const DEFAULT_CONVERSION_RATE_INR = '100.00';
    private const DIAMOND_SCALE = 10000; // 4 decimal places (0.0001 Diamond precision)

    /**
     * Get the authoritative Diamond conversion rate (INR per 1 Diamond).
     * Centralized so future rate adjustments do not require rewriting distribution logic.
     */
    public function getConversionRateInr(): string
    {
        $rawRate = config('mlm.diamond_conversion_rate', self::DEFAULT_CONVERSION_RATE_INR);
        $ratePaise = $this->decimalToScaled($rawRate, 2);
        if ($ratePaise <= 0) {
            throw new InvalidArgumentException('Diamond conversion rate must be greater than zero.');
        }

        return $this->formatScaled($ratePaise, 2);
    }

    /**
     * Convert an INR amount into exact 4-decimal Diamond quantity string
     * without floating-point arithmetic drift.
     */
    public function convertInrToDiamonds(float|int|string $amountInr): string
    {
        $amountPaise = $this->decimalToScaled($amountInr, 2);
        if ($amountPaise <= 0) {
            return '0.0000';
        }

        $ratePaise = $this->decimalToScaled($this->getConversionRateInr(), 2);
        $scaledDiamonds = $this->convertPaiseToScaledDiamonds($amountPaise, $ratePaise);

        return $this->formatScaled($scaledDiamonds, 4);
    }

    /**
     * Integer-scaled conversion from INR paise to ten-thousandths of a Diamond.
     */
    public function convertPaiseToScaledDiamonds(int $amountPaise, int $ratePaise): int
    {
        if ($amountPaise <= 0 || $ratePaise <= 0) {
            return 0;
        }

        return (int) round(($amountPaise * self::DIAMOND_SCALE) / $ratePaise);
    }

    /**
     * Parse a numeric/decimal value cleanly into a scaled integer without float error.
     */
    public function decimalToScaled(float|int|string|null $value, int $decimals = 4): int
    {
        if ($value === null || $value === '') {
            return 0;
        }

        $str = trim((string) $value);
        $negative = false;
        if (str_starts_with($str, '-')) {
            $negative = true;
            $str = substr($str, 1);
        } elseif (str_starts_with($str, '+')) {
            $str = substr($str, 1);
        }

        if ($str === '' || !is_numeric($str)) {
            return 0;
        }

        $parts = explode('.', $str, 2);
        $whole = ltrim($parts[0] === '' ? '0' : $parts[0], '0');
        $whole = $whole === '' ? '0' : $whole;
        $frac = $parts[1] ?? '';

        if (strlen($frac) > $decimals) {
            $roundedFrac = substr($frac, 0, $decimals);
            $nextDigit = (int) substr($frac, $decimals, 1);
            $factor = (int) (10 ** $decimals);
            $scaled = ((int) $whole * $factor) + (int) $roundedFrac;
            if ($nextDigit >= 5) {
                $scaled += 1;
            }
            return $negative ? -$scaled : $scaled;
        }

        $paddedFrac = str_pad($frac, $decimals, '0', STR_PAD_RIGHT);
        $factor = (int) (10 ** $decimals);
        $scaled = ((int) $whole * $factor) + (int) $paddedFrac;

        return $negative ? -$scaled : $scaled;
    }

    /**
     * Format a scaled integer cleanly back into a fixed-point decimal string.
     */
    public function formatScaled(int $scaled, int $decimals = 4): string
    {
        $negative = $scaled < 0;
        $abs = abs($scaled);
        $factor = (int) (10 ** $decimals);
        $whole = intdiv($abs, $factor);
        $frac = str_pad((string) ($abs % $factor), $decimals, '0', STR_PAD_LEFT);

        return ($negative ? '-' : '') . $whole . '.' . $frac;
    }

    /**
     * Distribute Two-Level Diamond Rewards inside an active database transaction.
     * - Reward Level 1 -> Member's Direct Sponsor (`users` only)
     * - Reward Level 2 -> Direct Sponsor's Sponsor (`users` only)
     * Missing or ineligible sponsors are audited cleanly without redirecting rewards.
     */
    public function distributePaymentRewards(
        Order $order,
        SalePayment $payment,
        float|string $rewardL1Amount,
        float|string $rewardL2Amount
    ): array {
        $conversionRate = $this->getConversionRateInr();
        $ratePaise = $this->decimalToScaled($conversionRate, 2);

        $buyerCode = trim((string) ($order->customer_user_code ?? ''));
        $sourceMember = $this->findMemberByCode($buyerCode);

        $recipients = $this->resolveRewardRecipients($sourceMember, $order);

        $levelsInput = [
            1 => $this->decimalToScaled($rewardL1Amount, 2),
            2 => $this->decimalToScaled($rewardL2Amount, 2),
        ];

        $results = [];

        foreach ($levelsInput as $level => $amountPaise) {
            // Strict idempotency check per payment + reward level
            $alreadyCredited = DiamondTransaction::where('sale_payment_id', $payment->id)
                ->where('reward_level', $level)
                ->where('transaction_type', 'credit')
                ->exists();

            if ($alreadyCredited) {
                throw new InvalidArgumentException(
                    "Diamond Reward Level {$level} for Payment #{$payment->id} has already been credited."
                );
            }

            $allocatedInr = $this->formatScaled($amountPaise, 2);
            $recipientInfo = $recipients[$level];

            if ($amountPaise <= 0) {
                $this->recordAudit([
                    'order_id' => $order->id,
                    'sale_payment_id' => $payment->id,
                    'reward_level' => $level,
                    'source_member_id' => $sourceMember?->id,
                    'source_member_code' => $sourceMember?->user_code ?: ($buyerCode ?: null),
                    'target_sponsor_code' => $recipientInfo['code'],
                    'target_user_id' => $recipientInfo['user']?->id,
                    'allocated_amount' => '0.00',
                    'conversion_rate' => $conversionRate,
                    'diamond_quantity' => '0.0000',
                    'status' => 'skipped_zero_amount',
                    'reason' => "Reward Level {$level} allocation is ₹0.00 under active settings.",
                ]);

                $results[$level] = [
                    'status' => 'skipped_zero_amount',
                    'allocated_amount' => 0.0,
                    'diamond_quantity' => '0.0000',
                    'user_id' => $recipientInfo['user']?->id,
                ];
                continue;
            }

            if (!$recipientInfo['eligible'] || !$recipientInfo['user']) {
                $this->recordAudit([
                    'order_id' => $order->id,
                    'sale_payment_id' => $payment->id,
                    'reward_level' => $level,
                    'source_member_id' => $sourceMember?->id,
                    'source_member_code' => $sourceMember?->user_code ?: ($buyerCode ?: null),
                    'target_sponsor_code' => $recipientInfo['code'],
                    'target_user_id' => $recipientInfo['user']?->id,
                    'allocated_amount' => $allocatedInr,
                    'conversion_rate' => $conversionRate,
                    'diamond_quantity' => '0.0000',
                    'status' => $recipientInfo['status'],
                    'reason' => $recipientInfo['reason'],
                ]);

                $results[$level] = [
                    'status' => $recipientInfo['status'],
                    'reason' => $recipientInfo['reason'],
                    'allocated_amount' => (float) $allocatedInr,
                    'diamond_quantity' => '0.0000',
                    'user_id' => null,
                ];
                continue;
            }

            /** @var User $sponsorUser */
            $sponsorUser = $recipientInfo['user'];
            $creditScaled = $this->convertPaiseToScaledDiamonds($amountPaise, $ratePaise);
            $diamondQtyStr = $this->formatScaled($creditScaled, 4);

            $wallet = $this->lockOrCreateWalletForUser($sponsorUser->id);

            $currentTotalScaled = $this->decimalToScaled($wallet->diamond_balance, 4);
            $newTotalScaled = $currentTotalScaled + $creditScaled;

            $levelCol = $level === 1 ? 'level_1_diamonds' : 'level_2_diamonds';
            $currentLevelScaled = $this->decimalToScaled($wallet->{$levelCol}, 4);
            $newLevelScaled = $currentLevelScaled + $creditScaled;

            $balanceAfterStr = $this->formatScaled($newTotalScaled, 4);

            $wallet->update([
                'diamond_balance' => $balanceAfterStr,
                $levelCol => $this->formatScaled($newLevelScaled, 4),
            ]);

            $sourceRef = "payment:{$payment->id}:reward_level:{$level}";
            $buyerDisplay = $sourceMember?->user_code ?: ($buyerCode ?: 'Member');
            $invoiceLabel = $order->invoice_number ?: ('Order #' . $order->id);

            $transaction = DiamondTransaction::create([
                'user_id' => $sponsorUser->id,
                'order_id' => $order->id,
                'sale_payment_id' => $payment->id,
                'source_reference' => $sourceRef,
                'reward_level' => $level,
                'source_member_id' => $sourceMember?->id,
                'source_member_code' => $buyerDisplay,
                'allocated_amount' => $allocatedInr,
                'conversion_rate' => $conversionRate,
                'diamond_quantity' => $diamondQtyStr,
                'balance_after' => $balanceAfterStr,
                'transaction_type' => 'credit',
                'description' => "Reward Level {$level} Diamond credit from {$invoiceLabel} ({$buyerDisplay}) at ₹{$conversionRate}/Diamond.",
            ]);

            $this->recordAudit([
                'order_id' => $order->id,
                'sale_payment_id' => $payment->id,
                'reward_level' => $level,
                'source_member_id' => $sourceMember?->id,
                'source_member_code' => $buyerDisplay,
                'target_sponsor_code' => $sponsorUser->user_code,
                'target_user_id' => $sponsorUser->id,
                'allocated_amount' => $allocatedInr,
                'conversion_rate' => $conversionRate,
                'diamond_quantity' => $diamondQtyStr,
                'status' => 'credited',
                'reason' => "Credited {$diamondQtyStr} Diamonds to {$sponsorUser->user_code}.",
            ]);

            $results[$level] = [
                'status' => 'credited',
                'transaction_id' => $transaction->id,
                'user_id' => $sponsorUser->id,
                'user_code' => $sponsorUser->user_code,
                'allocated_amount' => (float) $allocatedInr,
                'diamond_quantity' => $diamondQtyStr,
                'balance_after' => $balanceAfterStr,
            ];
        }

        return $results;
    }

    /**
     * Auditable compensating reversal for already-credited Diamond rewards on a payment receipt.
     * Creates immutable negative reversal entries rather than deleting historical credit records.
     */
    public function reversePaymentRewards(SalePayment $payment, string $reason = 'Order/Payment reward reversal'): array
    {
        return DB::transaction(function () use ($payment, $reason) {
            $credits = DiamondTransaction::where('sale_payment_id', $payment->id)
                ->where('transaction_type', 'credit')
                ->orderBy('reward_level', 'asc')
                ->lockForUpdate()
                ->get();

            if ($credits->isEmpty()) {
                return [];
            }

            $reversals = [];

            foreach ($credits as $creditTx) {
                $alreadyReversed = DiamondTransaction::where('sale_payment_id', $payment->id)
                    ->where('reward_level', $creditTx->reward_level)
                    ->where('transaction_type', 'reversal')
                    ->exists();

                if ($alreadyReversed) {
                    throw new InvalidArgumentException(
                        "Diamond Reward Level {$creditTx->reward_level} for Payment #{$payment->id} has already been reversed."
                    );
                }

                $wallet = $this->lockOrCreateWalletForUser($creditTx->user_id);

                $creditScaled = $this->decimalToScaled($creditTx->diamond_quantity, 4);
                $currentTotalScaled = $this->decimalToScaled($wallet->diamond_balance, 4);
                $newTotalScaled = $currentTotalScaled - $creditScaled;

                $levelCol = (int) $creditTx->reward_level === 1 ? 'level_1_diamonds' : 'level_2_diamonds';
                $currentLevelScaled = $this->decimalToScaled($wallet->{$levelCol}, 4);
                $newLevelScaled = $currentLevelScaled - $creditScaled;

                $balanceAfterStr = $this->formatScaled($newTotalScaled, 4);

                $wallet->update([
                    'diamond_balance' => $balanceAfterStr,
                    $levelCol => $this->formatScaled($newLevelScaled, 4),
                ]);

                $allocatedPaise = $this->decimalToScaled($creditTx->allocated_amount, 2);

                $reversalTx = DiamondTransaction::create([
                    'user_id' => $creditTx->user_id,
                    'order_id' => $creditTx->order_id,
                    'sale_payment_id' => $creditTx->sale_payment_id,
                    'source_reference' => $creditTx->source_reference . ':reversal',
                    'reward_level' => $creditTx->reward_level,
                    'source_member_id' => $creditTx->source_member_id,
                    'source_member_code' => $creditTx->source_member_code,
                    'allocated_amount' => $this->formatScaled(-$allocatedPaise, 2),
                    'conversion_rate' => $creditTx->conversion_rate,
                    'diamond_quantity' => $this->formatScaled(-$creditScaled, 4),
                    'balance_after' => $balanceAfterStr,
                    'transaction_type' => 'reversal',
                    'description' => "Compensating reversal: {$reason} (Original Tx #{$creditTx->id}).",
                ]);

                $this->recordAudit([
                    'order_id' => $creditTx->order_id,
                    'sale_payment_id' => $creditTx->sale_payment_id,
                    'reward_level' => $creditTx->reward_level,
                    'source_member_id' => $creditTx->source_member_id,
                    'source_member_code' => $creditTx->source_member_code,
                    'target_sponsor_code' => $creditTx->user?->user_code,
                    'target_user_id' => $creditTx->user_id,
                    'allocated_amount' => $this->formatScaled(-$allocatedPaise, 2),
                    'conversion_rate' => $creditTx->conversion_rate,
                    'diamond_quantity' => $this->formatScaled(-$creditScaled, 4),
                    'status' => 'reversed',
                    'reason' => $reason,
                ]);

                $reversals[] = $reversalTx;
            }

            return $reversals;
        });
    }

    /**
     * Resolve Level 1 (Direct Sponsor) and Level 2 (Sponsor's Sponsor) strictly within MLM Users.
     */
    protected function resolveRewardRecipients(?User $sourceMember, Order $order): array
    {
        $buyerCode = trim((string) ($sourceMember?->user_code ?: $order->customer_user_code ?: ''));

        // Resolve Level 1 Direct Sponsor
        $l1Code = trim((string) ($sourceMember ? $sourceMember->sponsor_id : ($order->sponsor ?? '')));
        $l1User = null;
        $l1Eval = [
            'eligible' => false,
            'code' => $l1Code !== '' ? $l1Code : null,
            'user' => null,
            'status' => 'skipped_missing_sponsor',
            'reason' => 'Buyer has no Direct Sponsor assigned.',
        ];

        if ($l1Code !== '' && strtolower($l1Code) !== 'root') {
            if ($buyerCode !== '' && strcasecmp($l1Code, $buyerCode) === 0) {
                $l1Eval['status'] = 'skipped_self_referral';
                $l1Eval['reason'] = 'Self-sponsored referral is ineligible for Level 1 Diamond Reward.';
            } else {
                $l1User = $this->findMemberByCode($l1Code);
                if (!$l1User) {
                    $l1Eval['status'] = 'skipped_missing_sponsor';
                    $l1Eval['reason'] = "Direct Sponsor '{$l1Code}' was not found in active member accounts.";
                } elseif ($sourceMember && $l1User->id === $sourceMember->id) {
                    $l1Eval['status'] = 'skipped_self_referral';
                    $l1Eval['reason'] = 'Member cannot receive self-sponsor Level 1 Diamond Reward.';
                } elseif (strtolower((string) ($l1User->status ?: 'active')) !== 'active') {
                    $l1Eval['user'] = $l1User;
                    $l1Eval['code'] = $l1User->user_code;
                    $l1Eval['status'] = 'skipped_ineligible_sponsor';
                    $l1Eval['reason'] = "Direct Sponsor '{$l1User->user_code}' is ineligible (status: {$l1User->status}).";
                } else {
                    $l1Eval['eligible'] = true;
                    $l1Eval['user'] = $l1User;
                    $l1Eval['code'] = $l1User->user_code;
                    $l1Eval['status'] = 'credited';
                    $l1Eval['reason'] = null;
                }
            }
        }

        // Resolve Level 2 (Sponsor's Sponsor) strictly via $l1User->sponsor_id
        $l2Eval = [
            'eligible' => false,
            'code' => null,
            'user' => null,
            'status' => 'skipped_missing_sponsor',
            'reason' => 'Level 2 Sponsor cannot be resolved because Direct Sponsor does not exist.',
        ];

        if ($l1User) {
            $l2Code = trim((string) ($l1User->sponsor_id ?? ''));
            $l2Eval['code'] = $l2Code !== '' ? $l2Code : null;

            if ($l2Code === '' || strtolower($l2Code) === 'root') {
                $l2Eval['status'] = 'skipped_missing_sponsor';
                $l2Eval['reason'] = "Direct Sponsor '{$l1User->user_code}' has no parent Sponsor (Root/empty).";
            } elseif (
                ($buyerCode !== '' && strcasecmp($l2Code, $buyerCode) === 0)
                || ($l1User->user_code && strcasecmp($l2Code, $l1User->user_code) === 0)
            ) {
                $l2Eval['status'] = 'skipped_self_referral';
                $l2Eval['reason'] = 'Level 2 Sponsor matched buyer or Level 1 Sponsor (circular/self-referral blocked).';
            } else {
                $l2User = $this->findMemberByCode($l2Code);
                if (!$l2User) {
                    $l2Eval['status'] = 'skipped_missing_sponsor';
                    $l2Eval['reason'] = "Level 2 Sponsor '{$l2Code}' was not found in member accounts.";
                } elseif (
                    $l2User->id === $l1User->id
                    || ($sourceMember && $l2User->id === $sourceMember->id)
                ) {
                    $l2Eval['status'] = 'skipped_self_referral';
                    $l2Eval['reason'] = 'Level 2 Sponsor cannot match buyer or Level 1 Sponsor.';
                } elseif (strtolower((string) ($l2User->status ?: 'active')) !== 'active') {
                    $l2Eval['user'] = $l2User;
                    $l2Eval['code'] = $l2User->user_code;
                    $l2Eval['status'] = 'skipped_ineligible_sponsor';
                    $l2Eval['reason'] = "Level 2 Sponsor '{$l2User->user_code}' is ineligible (status: {$l2User->status}).";
                } else {
                    $l2Eval['eligible'] = true;
                    $l2Eval['user'] = $l2User;
                    $l2Eval['code'] = $l2User->user_code;
                    $l2Eval['status'] = 'credited';
                    $l2Eval['reason'] = null;
                }
            }
        }

        return [
            1 => $l1Eval,
            2 => $l2Eval,
        ];
    }

    protected function findMemberByCode(?string $code): ?User
    {
        $clean = trim((string) $code);
        if ($clean === '' || strtolower($clean) === 'root') {
            return null;
        }

        return User::where('user_code', $clean)
            ->orWhere(function ($q) use ($clean) {
                if (ctype_digit($clean)) {
                    $q->where('id', (int) $clean);
                }
            })
            ->first();
    }

    protected function lockOrCreateWalletForUser(int $userId): DiamondWallet
    {
        $wallet = DiamondWallet::where('user_id', $userId)->lockForUpdate()->first();
        if ($wallet) {
            return $wallet;
        }

        try {
            DiamondWallet::create([
                'user_id' => $userId,
                'diamond_balance' => '0.0000',
                'level_1_diamonds' => '0.0000',
                'level_2_diamonds' => '0.0000',
            ]);
        } catch (UniqueConstraintViolationException $e) {
            // Concurrent request already created the wallet row
        }

        return DiamondWallet::where('user_id', $userId)->lockForUpdate()->firstOrFail();
    }

    protected function recordAudit(array $attributes): void
    {
        DiamondRewardAudit::updateOrCreate(
            [
                'sale_payment_id' => $attributes['sale_payment_id'],
                'reward_level' => $attributes['reward_level'],
                'status' => $attributes['status'],
            ],
            $attributes
        );
    }
}
