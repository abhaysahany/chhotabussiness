import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../constants/app_colors.dart';
import '../../services/payout_service.dart';
import '../../widgets/app_drawer.dart';

class TransactionsScreen extends StatefulWidget {
  final Map<String, dynamic> user;

  const TransactionsScreen({super.key, required this.user});

  @override
  State<TransactionsScreen> createState() => _TransactionsScreenState();
}

class _TransactionsScreenState extends State<TransactionsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isLoading = true;
  String? _error;

  List<dynamic> _payouts = [];
  Map<String, dynamic>? _payoutSummary;
  List<dynamic> _purchases = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final userCode = widget.user['user_code']?.toString() ?? widget.user['userCode']?.toString();
      final results = await Future.wait([
        PayoutService.getPayouts(userCode: userCode),
        PayoutService.getBusinessReports(userCode: userCode),
      ]);

      if (mounted) {
        setState(() {
          final pRes = results[0];
          _payouts = pRes['payouts'] as List<dynamic>? ?? [];
          _payoutSummary = pRes['summary'] as Map<String, dynamic>?;

          final bRes = results[1];
          _purchases = bRes['salesList'] as List<dynamic>? ?? [];
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString().replaceFirst('Exception: ', '');
          _isLoading = false;
        });
      }
    }
  }

  void _openWithdrawDialog() {
    final amountController = TextEditingController();
    bool submitting = false;
    String selectedMethod = 'Bank Account';

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) {
          final balance = double.tryParse(widget.user['commission_balance']?.toString() ?? '0') ?? 0;

          return AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            title: Text(
              'Request Withdrawal',
              style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 17),
            ),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.primaryLight,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Available Balance:', style: GoogleFonts.inter(fontSize: 12, color: AppColors.primary)),
                        Text(
                          '₹$balance',
                          style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.primary),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: amountController,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      labelText: 'Withdrawal Amount (Min ₹500) *',
                      labelStyle: GoogleFonts.inter(fontSize: 12),
                      prefixText: '₹ ',
                      border: const OutlineInputBorder(),
                      isDense: true,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text('Disbursement Mode:', style: GoogleFonts.inter(fontSize: 12, color: AppColors.textMuted)),
                  const SizedBox(height: 6),
                  DropdownButtonFormField<String>(
                    value: selectedMethod,
                    items: const [
                      DropdownMenuItem(value: 'Bank Account', child: Text('Primary Bank Account')),
                      DropdownMenuItem(value: 'UPI ID', child: Text('Primary UPI Account')),
                    ],
                    onChanged: (val) {
                      if (val != null) setDialogState(() => selectedMethod = val);
                    },
                    decoration: const InputDecoration(border: OutlineInputBorder(), isDense: true),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'Note: 5% statutory TDS (Section 194H) is deducted at settlement. Weekly disbursements processed automatically.',
                    style: GoogleFonts.inter(fontSize: 10, color: AppColors.textLight),
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: Text('Cancel', style: GoogleFonts.inter(color: AppColors.textMuted)),
              ),
              ElevatedButton(
                onPressed: submitting
                    ? null
                    : () async {
                        final amt = double.tryParse(amountController.text.trim()) ?? 0;
                        if (amt < 500) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Minimum withdrawal amount is ₹500')),
                          );
                          return;
                        }
                        if (amt > balance && balance > 0) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Withdrawal amount cannot exceed available balance')),
                          );
                          return;
                        }

                        setDialogState(() => submitting = true);
                        try {
                          await PayoutService.requestWithdrawal(
                            amount: amt,
                            payoutMethod: selectedMethod,
                          );
                          if (ctx.mounted) Navigator.pop(ctx);
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Withdrawal request submitted successfully!'),
                                backgroundColor: AppColors.success,
                              ),
                            );
                            _loadData();
                          }
                        } catch (e) {
                          setDialogState(() => submitting = false);
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(e.toString().replaceFirst('Exception: ', '')),
                                backgroundColor: AppColors.error,
                              ),
                            );
                          }
                        }
                      },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                ),
                child: submitting
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Submit Request'),
              ),
            ],
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final totalDisbursed = _payoutSummary?['totalDisbursedFormatted'] ?? '₹0';
    final totalTds = _payoutSummary?['totalTdsFormatted'] ?? '₹0';
    final pendingCount = _payoutSummary?['pendingCount'] ?? 0;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: const BackButton(),
        title: Text(
          'Transactions & Payouts',
          style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 17),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_card_rounded, color: AppColors.primary),
            tooltip: 'Request Payout',
            onPressed: _openWithdrawDialog,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadData,
        color: AppColors.primary,
        child: NestedScrollView(
          headerSliverBuilder: (context, innerBoxIsScrolled) => [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    // Stats Row
                    Row(
                      children: [
                        Expanded(
                          child: _buildMetric(
                            'Net Disbursed',
                            '$totalDisbursed',
                            Icons.check_circle_rounded,
                            AppColors.success,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: _buildMetric(
                            'TDS Deducted',
                            '$totalTds',
                            Icons.receipt_rounded,
                            AppColors.error,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: _buildMetric(
                            'Pending',
                            '$pendingCount Requests',
                            Icons.hourglass_top_rounded,
                            AppColors.warning,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    // Quick Request Button
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: _openWithdrawDialog,
                        icon: const Icon(Icons.account_balance_rounded, size: 18),
                        label: const Text('Request New Payout Withdrawal'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.secondary,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Tabs
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.cardBorder),
                      ),
                      child: TabBar(
                        controller: _tabController,
                        indicatorColor: AppColors.primary,
                        labelColor: AppColors.primary,
                        unselectedLabelColor: AppColors.textMuted,
                        labelStyle: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 13),
                        tabs: [
                          Tab(text: 'Payouts (${_payouts.length})'),
                          Tab(text: 'Purchases / Orders (${_purchases.length})'),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
          body: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : TabBarView(
                  controller: _tabController,
                  children: [
                    _buildPayoutsTab(),
                    _buildPurchasesTab(),
                  ],
                ),
        ),
      ),
    );
  }

  Widget _buildMetric(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(height: 6),
          Text(
            value,
            style: GoogleFonts.poppins(
              fontSize: 13,
              fontWeight: FontWeight.w800,
              color: AppColors.textHeading,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          Text(
            title,
            style: GoogleFonts.inter(fontSize: 10, color: AppColors.textMuted),
          ),
        ],
      ),
    );
  }

  Widget _buildPayoutsTab() {
    if (_payouts.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.receipt_long_outlined, size: 48, color: AppColors.textLight),
            const SizedBox(height: 10),
            Text('No payout records found.', style: GoogleFonts.poppins(fontWeight: FontWeight.w600, color: AppColors.textHeading)),
            Text('Submit a withdrawal request to receive disbursements.', style: GoogleFonts.inter(fontSize: 12, color: AppColors.textMuted)),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      itemCount: _payouts.length,
      itemBuilder: (ctx, idx) {
        final p = _payouts[idx] is Map<String, dynamic> ? _payouts[idx] : Map<String, dynamic>.from(_payouts[idx] as Map);
        final payoutCode = p['payout_code'] ?? p['id'] ?? 'PAY-00';
        final gross = p['requested_amount'] ?? p['amount'] ?? '0';
        final net = p['net_payable_amount'] ?? p['net'] ?? gross;
        final tds = p['tds_deduction'] ?? '0';
        final status = p['status']?.toString().toLowerCase() ?? 'pending';
        final date = p['request_date']?.toString().split('T').first ?? '—';
        final utr = p['utr_number']?.toString() ?? '';

        return Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.cardBorder),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Payout Code: $payoutCode',
                    style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textHeading),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                    decoration: BoxDecoration(
                      color: status == 'completed' || status == 'approved' ? AppColors.successLight : AppColors.warningLight,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      status.toUpperCase(),
                      style: GoogleFonts.inter(
                        fontSize: 9,
                        fontWeight: FontWeight.w700,
                        color: status == 'completed' || status == 'approved' ? AppColors.success : AppColors.warning,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 2),
              Text('Date: $date ${utr.isNotEmpty ? "• UTR: $utr" : ""}', style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted)),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Gross Withdrawal', style: GoogleFonts.inter(fontSize: 10, color: AppColors.textLight)),
                      Text('₹$gross', style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textHeading)),
                    ],
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('TDS 5% (194H)', style: GoogleFonts.inter(fontSize: 10, color: AppColors.textLight)),
                      Text('-₹$tds', style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.error)),
                    ],
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text('Net Disbursed', style: GoogleFonts.inter(fontSize: 10, color: AppColors.textLight)),
                      Text('₹$net', style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.success)),
                    ],
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildPurchasesTab() {
    if (_purchases.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.shopping_bag_outlined, size: 48, color: AppColors.textLight),
            const SizedBox(height: 10),
            Text('No order purchase invoices found.', style: GoogleFonts.poppins(fontWeight: FontWeight.w600, color: AppColors.textHeading)),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      itemCount: _purchases.length,
      itemBuilder: (ctx, idx) {
        final b = _purchases[idx] is Map<String, dynamic> ? _purchases[idx] : Map<String, dynamic>.from(_purchases[idx] as Map);
        final invoiceId = b['id'] ?? 'INV-00';
        final service = b['service'] ?? b['package_name'] ?? 'Package Service';
        final amount = b['amount'] ?? '0';
        final date = b['date'] ?? '—';

        return Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.cardBorder),
          ),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppColors.secondary.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.receipt_rounded, color: AppColors.secondary, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      service,
                      style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textHeading),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text('Invoice: $invoiceId • $date', style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted)),
                  ],
                ),
              ),
              Text(
                '₹$amount',
                style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.primary),
              ),
            ],
          ),
        );
      },
    );
  }
}
