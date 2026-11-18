import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../constants/app_colors.dart';
import '../../services/income_service.dart';
import '../../widgets/app_drawer.dart';

class DirectIncomeScreen extends StatefulWidget {
  final Map<String, dynamic> user;

  const DirectIncomeScreen({super.key, required this.user});

  @override
  State<DirectIncomeScreen> createState() => _DirectIncomeScreenState();
}

class _DirectIncomeScreenState extends State<DirectIncomeScreen> {
  bool _isLoading = true;
  String? _error;
  Map<String, dynamic>? _summary;
  List<dynamic> _records = [];
  String _searchQuery = '';
  String _statusFilter = 'all';

  @override
  void initState() {
    super.initState();
    _fetchDirectIncome();
  }

  Future<void> _fetchDirectIncome() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final res = await IncomeService.getDirectIncome();
      if (mounted) {
        setState(() {
          _summary = res['summary'] as Map<String, dynamic>?;
          _records = res['records'] as List<dynamic>? ?? [];
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

  List<dynamic> get _filteredRecords {
    return _records.where((r) {
      final name = r['userName']?.toString().toLowerCase() ?? r['user_name']?.toString().toLowerCase() ?? '';
      final code = r['userCode']?.toString().toLowerCase() ?? r['user_code']?.toString().toLowerCase() ?? '';
      final query = _searchQuery.toLowerCase();
      final matchesQuery = query.isEmpty || name.contains(query) || code.contains(query);

      final status = r['status']?.toString().toLowerCase() ?? 'active';
      final matchesStatus = _statusFilter == 'all' || status == _statusFilter;

      return matchesQuery && matchesStatus;
    }).toList();
  }

  void _showRecordDetails(Map<String, dynamic> record) {
    final name = record['userName'] ?? record['user_name'] ?? 'Member';
    final code = record['userCode'] ?? record['user_code'] ?? '—';
    final total = record['totalAmount'] ?? record['total_amount'] ?? '0';
    final paid = record['paidAmount'] ?? record['paid_amount'] ?? '0';
    final balance = record['balanceAmount'] ?? record['balance_amount'] ?? '0';
    final status = record['status']?.toString() ?? 'active';
    final sponsor = record['sponsorId'] ?? record['sponsor_id'] ?? 'Direct';
    final created = record['created_at']?.toString() ?? '—';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 18),
            Text(
              'Direct Income Breakdown',
              style: GoogleFonts.poppins(fontSize: 17, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 14),
            _buildModalRow('Member Name', '$name ($code)'),
            _buildModalRow('Sponsor Attribution', '$sponsor'),
            _buildModalRow('Total Direct Commission', '₹$total'),
            _buildModalRow('Disbursed / Paid Amount', '₹$paid'),
            _buildModalRow('Remaining Balance', '₹$balance'),
            _buildModalRow('Status', status.toUpperCase()),
            _buildModalRow('Record Date', created.split('T').first),
            const SizedBox(height: 18),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(ctx),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                child: const Text('Close'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildModalRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: GoogleFonts.inter(fontSize: 12, color: AppColors.textMuted)),
          Text(
            value,
            style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textHeading),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final totalIncome = _summary?['total_amount'] ?? _summary?['totalAmount'] ?? '0';
    final totalPaid = _summary?['paid_amount'] ?? _summary?['paidAmount'] ?? '0';
    final totalBalance = _summary?['balance_amount'] ?? _summary?['balanceAmount'] ?? '0';

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: const BackButton(),
        title: Text(
          'Direct Income',
          style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 18),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _fetchDirectIncome,
        color: AppColors.primary,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Summary Cards
              Row(
                children: [
                  Expanded(
                    child: _buildSummaryCard(
                      'Total Income',
                      '₹$totalIncome',
                      Icons.monetization_on_rounded,
                      AppColors.primary,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _buildSummaryCard(
                      'Paid to Bank',
                      '₹$totalPaid',
                      Icons.check_circle_rounded,
                      AppColors.success,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _buildSummaryCard(
                      'Balance',
                      '₹$totalBalance',
                      Icons.account_balance_wallet_rounded,
                      AppColors.secondary,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Search Bar
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.cardBorder),
                ),
                child: TextField(
                  onChanged: (val) => setState(() => _searchQuery = val),
                  decoration: InputDecoration(
                    hintText: 'Search by downline name or code...',
                    hintStyle: GoogleFonts.inter(fontSize: 13, color: AppColors.textLight),
                    prefixIcon: const Icon(Icons.search_rounded, color: AppColors.textMuted, size: 20),
                    border: InputBorder.none,
                    isDense: true,
                  ),
                ),
              ),
              const SizedBox(height: 12),

              // Status Chips
              Row(
                children: [
                  _buildStatusChip('All', 'all'),
                  const SizedBox(width: 8),
                  _buildStatusChip('Paid', 'paid'),
                  const SizedBox(width: 8),
                  _buildStatusChip('Partial', 'partial'),
                  const SizedBox(width: 8),
                  _buildStatusChip('Active', 'active'),
                ],
              ),
              const SizedBox(height: 16),

              // Direct Income Records
              if (_isLoading)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(40),
                    child: CircularProgressIndicator(),
                  ),
                )
              else if (_error != null)
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: AppColors.errorLight,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppColors.errorBorder),
                  ),
                  child: Text(_error!, style: GoogleFonts.inter(color: AppColors.error)),
                )
              else if (_filteredRecords.isEmpty)
                Container(
                  padding: const EdgeInsets.all(36),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppColors.cardBorder),
                  ),
                  child: Center(
                    child: Column(
                      children: [
                        const Icon(Icons.payments_outlined, size: 48, color: AppColors.textLight),
                        const SizedBox(height: 10),
                        Text(
                          'No direct income records found',
                          style: GoogleFonts.poppins(
                            fontWeight: FontWeight.w600,
                            color: AppColors.textHeading,
                          ),
                        ),
                        Text(
                          'Direct commissions from direct referrals will show here',
                          style: GoogleFonts.inter(fontSize: 12, color: AppColors.textMuted),
                        ),
                      ],
                    ),
                  ),
                )
              else
                ..._filteredRecords.map((r) {
                  final rec = r is Map<String, dynamic> ? r : Map<String, dynamic>.from(r as Map);
                  final name = rec['userName'] ?? rec['user_name'] ?? 'Member';
                  final code = rec['userCode'] ?? rec['user_code'] ?? '—';
                  final total = rec['totalAmount'] ?? rec['total_amount'] ?? '0';
                  final paid = rec['paidAmount'] ?? rec['paid_amount'] ?? '0';
                  final balance = rec['balanceAmount'] ?? rec['balance_amount'] ?? '0';
                  final status = rec['status']?.toString().toLowerCase() ?? 'active';

                  return Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppColors.cardBorder),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.02),
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: InkWell(
                      onTap: () => _showRecordDetails(rec),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(
                                  name,
                                  style: GoogleFonts.inter(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.textHeading,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                decoration: BoxDecoration(
                                  color: status == 'paid'
                                      ? AppColors.successLight
                                      : (status == 'partial' ? AppColors.warningLight : AppColors.primaryLight),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  status.toUpperCase(),
                                  style: GoogleFonts.inter(
                                    fontSize: 9,
                                    fontWeight: FontWeight.w700,
                                    color: status == 'paid'
                                        ? AppColors.success
                                        : (status == 'partial' ? AppColors.warning : AppColors.primary),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 2),
                          Text('Member ID: $code', style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted)),
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('Total Direct', style: GoogleFonts.inter(fontSize: 10, color: AppColors.textLight)),
                                  Text('₹$total', style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textHeading)),
                                ],
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('Paid Amount', style: GoogleFonts.inter(fontSize: 10, color: AppColors.textLight)),
                                  Text('₹$paid', style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.success)),
                                ],
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text('Balance', style: GoogleFonts.inter(fontSize: 10, color: AppColors.textLight)),
                                  Text('₹$balance', style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.secondary)),
                                ],
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  );
                }),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSummaryCard(String title, String value, IconData icon, Color color) {
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
              fontSize: 14,
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

  Widget _buildStatusChip(String label, String value) {
    final isSelected = _statusFilter == value;
    return GestureDetector(
      onTap: () => setState(() => _statusFilter = value),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isSelected ? AppColors.primary : AppColors.cardBorder),
        ),
        child: Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 11,
            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
            color: isSelected ? Colors.white : AppColors.textMuted,
          ),
        ),
      ),
    );
  }
}
