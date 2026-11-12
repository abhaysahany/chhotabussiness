# VYAPAR ADNET – DIAMOND REWARD SYSTEM AUDIT REPORT

**Date:** 2026-11-12  
**Scope:** Pre-implementation audit & target architecture verification for extending Global Commission Settings with the Two-Level Diamond Reward Distribution System across Backend (`backend/`), Admin Panel (`admin/`), User Panel (`user/`), and MySQL (`vyaparadnet` / `chhotabiz_test`).

---

## 1. Executive Audit Summary

Before implementing the Two-Level Diamond Reward System, the existing codebase and database schema were audited to verify:
1. How global commission allocation (`commission_settings`) currently stores and validates Direct, Level 1–5, and Reward percentages.
2. Whether any dedicated Diamond wallet, Diamond ledger, or Diamond conversion logic existed previously.
3. How cash wallets, BP milestone claims, payouts, and payment-based income allocation (`AdminIncomeAllocationService`) isolate non-cash vs cash balances.
4. How order cancellation or payment reversal behaves in the backend so Diamond reversals can be designed safely without mutating historical records.

### Key Findings

| Area | Pre-Implementation State | Audit Conclusion / Requirement |
|---|---|---|
| **Global Commission Settings (`commission_settings`)** | Single singleton row (`setting_key = 'global'`) with `direct_percent` (40%), `level_1_percent`..`level_5_percent` (0%, 16%, 12%, 8%, 4%), and a single `reward_percent` (20%). | Extend table with `reward_level_1_percent` and `reward_level_2_percent`, migrating legacy `reward_percent` into `reward_level_1_percent` (`20.00`) and initializing `reward_level_2_percent = 0.00`, while preserving `reward_percent` as the backward-compatible sum. |
| **Diamond Conversion & Rate** | No Diamond conversion config or rate constant existed in `backend/config/`. | Introduce centralized `backend/config/mlm.php` defining `'diamond_conversion_rate' => (float) env('MLM_DIAMOND_CONVERSION_RATE', 100.00)` (₹100 = 1 Diamond). |
| **Wallets & Rewards Separation** | `users` table only had `commission_balance` (cash payout wallet), `bp_balance`, `personal_pv`, `group_pv`, and `team_biz`. Existing `rewards` & `reward_claims` tables only handle physical BP milestone gift claims. | Create dedicated non-cash Diamond storage (`diamond_wallets`, `diamond_transactions`, `diamond_reward_audits`) completely isolated from `commission_balance`, `user_payouts`, `bp_balance`, PV/BV, and Entity accounts. |
| **Confirmed Payment Allocation (`AdminIncomeAllocationService`)** | `allocatePaymentIncome()` runs inside `DB::transaction()` with row locks on `SalePayment` and `Order`, enforcing `approval_status === 'confirmed'`, idempotent `income_distribution_status`, and paise-level `calculateSplit()`. | Split reward allocation into `reward_level_1_amount` and `reward_level_2_amount` inside `calculateSplit()`, and invoke `DiamondRewardService::distributePaymentRewards()` atomically inside the same `DB::transaction()`. |
| **MLM Sponsor Resolution & Isolation** | `users.user_code` + `users.sponsor_id` store the MLM member sponsor chain. Orders store `customer_user_code` and `sponsor`. | Resolve Level 1 (Direct Sponsor) from buyer's `sponsor_id` and Level 2 (Sponsor's Sponsor) strictly from Level 1 Sponsor's `sponsor_id` in `users`. Missing/inactive/self-referral/entity sponsors must be audited and skipped without redirecting or crediting entities. |
| **Order Cancellation / Reversal** | `OrderController::cancelOrder()` strictly rejects cancelling confirmed orders (`approval_status === 'confirmed'`); no confirmed-order refund endpoint currently exists. | Keep `OrderController::cancelOrder()` untouched; provide an explicit auditable `DiamondRewardService::reversePaymentRewards()` helper creating immutable negative `reversal` ledger entries and adjusting wallet balances if ever needed in future refund workflows. |
| **User Panel Rewards UI** | `user/src/components/payments/RewardDetails.jsx` mounted at `/payments/rewards` only showed BP Wallet Balance and physical gift milestones via `userRewardService.js`. | Add non-cash **My Diamond Rewards** section above Available Milestone Rewards consuming authenticated `GET /api/user/diamonds`. |

---

## 2. Database & Financial Separation Audit

### Cash & BP Systems Verified Untouched
- **`users.commission_balance` & `user_payouts`**: Governed exclusively by `DirectIncome`, `LevelIncome`, and `UserPayoutController` (`kyc_status === 'verified'`, `commission_balance >= 500`). Diamond credits must **never** touch `commission_balance` or become withdrawable via `user_payouts`.
- **`users.bp_balance`, `rewards`, `reward_claims`**: Handled by `RewardController` for physical milestone claims. Left 100% separate from Diamond Rewards.
- **`orders.dump_amount` & Dump Workflows**: Strictly isolated from allocatable admin commission cut (`admin_commission_cut`) and Direct/Level/Reward income.
- **Entity Accounts (`business_entities`, `freelancer_entities`, `entity_payouts`)**: Entities only receive net entity realization after admin cut (`Admin Commission Cut` split); Entities must never receive MLM Sponsor Diamond Rewards.

---

## 3. Target Validation & Accounting Invariants

1. **Exact 100% Basis-Point Sum Rule**:  
   `direct_percent + sum(level_1..level_N_percent) + reward_level_1_percent + reward_level_2_percent = 100.00%` (strictly enforced in integer basis points; legacy `reward_percent` must never be double-counted alongside `reward_level_1_percent` / `reward_level_2_percent`).
2. **Exact Integer-Scaled Diamond Math**:  
   Using paise (`10^-2` INR) and 4-decimal Diamond scale (`10^-4` Diamonds), e.g.:
   - ₹10,000 allocatable cut at 20% L1 / 10% L2 → ₹2,000.00 L1 (`20.0000` Diamonds) and ₹1,000.00 L2 (`10.0000` Diamonds).
   - ₹250.00 reward amount at ₹100 = 1 Diamond → `2.5000` Diamonds.
3. **Database Idempotency & Immutability**:  
   Unique composite constraints on `diamond_transactions` (`[sale_payment_id, reward_level, transaction_type]` and `[source_reference, transaction_type]`) prevent duplicate credits under concurrent requests, while `diamond_reward_audits` records skipped/credited/reversed outcomes cleanly.
