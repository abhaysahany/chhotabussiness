<?php

namespace App\Http\Controllers;

use App\Models\DiamondTransaction;
use App\Models\DiamondWallet;
use App\Models\OrderPaymentDump;
use App\Models\User;
use App\Services\DiamondRewardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;

class DiamondRewardController extends Controller
{
    protected DiamondRewardService $diamondService;

    public function __construct(DiamondRewardService $diamondService)
    {
        $this->diamondService = $diamondService;
    }

    /**
     * Resolve strictly the authenticated MLM Member (never trusting query parameters).
     */
    protected function resolveAuthenticatedUser(Request $request): ?User
    {
        $user = $request->user();

        if (!$user && auth('sanctum')->check()) {
            $user = auth('sanctum')->user();
        }

        if (!$user && $request->bearerToken()) {
            if (class_exists(PersonalAccessToken::class)) {
                $token = PersonalAccessToken::findToken($request->bearerToken());
                if ($token && $token->tokenable instanceof User) {
                    $user = $token->tokenable;
                }
            }
        }

        return $user instanceof User ? $user : null;
    }

    /**
     * Auto-sync any approved order payment dumps for this user so historical and newly approved dumps
     * are reliably reconciled in diamond_transactions.
     */
    protected function syncUserApprovedDumpRewards(User $user): void
    {
        $approvedDumps = OrderPaymentDump::with('order')
            ->where('status', 'approved')
            ->get();

        foreach ($approvedDumps as $dump) {
            if (!$dump->order) {
                continue;
            }
            $this->diamondService->recordDumpRewards($dump->order, $dump);
        }
    }

    /**
     * Fetch the authenticated Member's Diamond Wallet balance & immutable Diamond Ledger history.
     *
     * GET /api/user/diamonds
     */
    public function index(Request $request): JsonResponse
    {
        $user = $this->resolveAuthenticatedUser($request);
        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized. Please log in as a Member to view Diamond Rewards.',
            ], 401);
        }

        // Auto-sync any approved dumps for this user if missing in diamond_transactions
        $this->syncUserApprovedDumpRewards($user);

        $wallet = DiamondWallet::where('user_id', $user->id)->first();

        $transactions = DiamondTransaction::with(['order:id,invoice_number,item,gross_amount', 'sourceMember:id,user_code,name'])
            ->where('user_id', $user->id)
            ->orderBy('id', 'desc')
            ->get();

        $conversionRate = (float) $this->diamondService->getConversionRateInr();

        // Calculate Dump metrics
        $dumpTransactions = $transactions->where('transaction_type', 'dump');
        $totalDumpInr = (float) round($dumpTransactions->sum('allocated_amount'), 2);
        $totalDumpDiamonds = (float) round($dumpTransactions->sum('diamond_quantity'), 4);
        $l1DumpDiamonds = (float) round($dumpTransactions->where('reward_level', 1)->sum('diamond_quantity'), 4);
        $l2DumpDiamonds = (float) round($dumpTransactions->where('reward_level', 2)->sum('diamond_quantity'), 4);

        $formattedTransactions = $transactions->map(function ($tx) {
            $invoiceNo = $tx->order?->invoice_number;
            $sourceLabel = $invoiceNo ?: ($tx->order_id ? "Order #{$tx->order_id}" : $tx->source_reference);

            $isDump = $tx->transaction_type === 'dump';
            $isReversal = in_array($tx->transaction_type, ['reversal', 'debit']);

            return [
                'id' => $tx->id,
                'order_id' => $tx->order_id,
                'sale_payment_id' => $tx->sale_payment_id,
                'invoice_number' => $invoiceNo,
                'source' => $sourceLabel,
                'source_reference' => $tx->source_reference,
                'reward_level' => (int) $tx->reward_level,
                'reward_level_label' => (int) $tx->reward_level === 1
                    ? 'Level 1 (Direct Sponsor)'
                    : 'Level 2 (Sponsor\'s Sponsor)',
                'source_member_id' => $tx->source_member_id,
                'source_member_code' => $tx->source_member_code ?: $tx->sourceMember?->user_code,
                'source_member_name' => $tx->sourceMember?->name,
                'allocated_amount' => (float) $tx->allocated_amount,
                'conversion_rate' => (float) $tx->conversion_rate,
                'diamond_quantity' => (float) $tx->diamond_quantity,
                'balance_after' => (float) $tx->balance_after,
                'transaction_type' => $tx->transaction_type,
                'is_dump' => $isDump,
                'is_reversal' => $isReversal,
                'description' => $tx->description,
                'created_at' => $tx->created_at?->toIso8601String(),
            ];
        })->values()->all();

        return response()->json([
            'status' => 'success',
            'user' => [
                'id' => $user->id,
                'user_code' => $user->user_code,
                'name' => $user->name,
            ],
            'wallet' => [
                'diamond_balance' => (float) ($wallet?->diamond_balance ?? 0),
                'level_1_diamonds' => (float) ($wallet?->level_1_diamonds ?? 0),
                'level_2_diamonds' => (float) ($wallet?->level_2_diamonds ?? 0),
                'dump_diamonds' => $totalDumpDiamonds,
                'dump_diamonds_l1' => $l1DumpDiamonds,
                'dump_diamonds_l2' => $l2DumpDiamonds,
                'dump_reward_inr' => $totalDumpInr,
                'conversion_rate_inr' => $conversionRate,
                'updated_at' => $wallet?->updated_at?->toIso8601String(),
            ],
            'dump_summary' => [
                'total_dump_diamonds' => $totalDumpDiamonds,
                'total_dump_inr' => $totalDumpInr,
                'dump_records_count' => $dumpTransactions->count(),
                'level_1_dump_diamonds' => $l1DumpDiamonds,
                'level_2_dump_diamonds' => $l2DumpDiamonds,
            ],
            'transactions' => $formattedTransactions,
            'total_transactions' => count($formattedTransactions),
        ]);
    }
}
