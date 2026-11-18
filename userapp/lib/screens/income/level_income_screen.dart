import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../constants/app_colors.dart';
import '../../services/income_service.dart';
import '../../widgets/app_drawer.dart';

class LevelIncomeScreen extends StatefulWidget {
  final Map<String, dynamic> user;

  const LevelIncomeScreen({super.key, required this.user});

  @override
  State<LevelIncomeScreen> createState() => _LevelIncomeScreenState();
}

class _LevelIncomeScreenState extends State<LevelIncomeScreen> {
  bool _isLoading = true;
  String? _error;
  Map<String, dynamic>? _summary;
  List<dynamic> _levelsBreakdown = [];
  List<dynamic> _records = [];

  String _searchQuery = '';
  String _selectedLevel = 'all';

  @override
  void initState() {
    super.initState();
    _fetchLevelIncome();
  }

  Future<void> _fetchLevelIncome() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final res = await IncomeService.getLevelIncome();
      if (mounted) {
        setState(() {
          _summary = res['summary'] as Map<String, dynamic>?;
          _levelsBreakdown = res['levels'] as List<dynamic>? ?? [];
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
      final source = r['sourceMember']?.toString().toLowerCase() ?? r['source_member']?.toString().toLowerCase() ?? '';
      final query = _searchQuery.toLowerCase();
      final matchesQuery = query.isEmpty || name.contains(query) || source.contains(query);

      final lvl = r['level']?.toString() ?? r['level_number']?.toString() ?? '2';
      final matchesLevel = _selectedLevel == 'all' || lvl == _selectedLevel;

      return matchesQuery && matchesLevel;
    }).toList();
  }

  void _showRecordDetails(Map<String, dynamic> record) {
    final name = record['userName'] ?? record['user_name'] ?? 'Member';
    final lvl = record['level'] ?? record['level_number'] ?? '2';
    final source = record['sourceMember'] ?? record['source_member'] ?? '—';
    final total = record['totalAmount'] ?? record['total_amount'] ?? '0';
    final paid = record['paidAmount'] ?? record['paid_amount'] ?? '0';
    final balance = record['balanceAmount'] ?? record['balance_amount'] ?? '0';
    final status = record['status']?.toString() ?? 'active';

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
              'Level $lvl Commission Details',
              style: GoogleFonts.poppins(fontSize: 17, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 14),
            _buildModalRow('Generating Member', '$name'),
            _buildModalRow('Downline Source Member', '$source'),
            _buildModalRow('Network Level', 'Level $lvl (2% Override)'),
            _buildModalRow('Total Level Commission', '₹$total'),
            _buildModalRow('Disbursed Amount', '₹$paid'),
            _buildModalRow('Available Balance', '₹$balance'),
            _buildModalRow('Distribution Status', status.toUpperCase()),
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
    final totalLevelIncome = _summary?['total_amount'] ?? _summary?['totalAmount'] ?? '0';
    final paidAmount = _summary?['paid_amount'] ?? _summary?['paidAmount'] ?? '0';
    final balanceAmount = _summary?['balance_amount'] ?? _summary?['balanceAmount'] ?? '0';

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: const BackButton(),
        title: Text(
          'Level Income',
          style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 18),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _fetchLevelIncome,
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
                      'Level Income',
                      '₹$totalLevelIncome',
                      Icons.layers_rounded,
                      AppColors.primary,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _buildSummaryCard(
                      'Paid to Bank',
                      '₹$paidAmount',
                      Icons.check_circle_rounded,
                      AppColors.success,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _buildSummaryCard(
                      'Remaining',
                      '₹$balanceAmount',
                      Icons.account_balance_wallet_rounded,
                      AppColors.secondary,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Level Cards Breakdown (Level 2 to Level 5/10)
              if (_levelsBreakdown.isNotEmpty) ...[
                Text(
                  'Multi-Level Commission Breakdown',
                  style: GoogleFonts.poppins(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textHeading,
                  ),
                ),
                const SizedBox(height: 10),
                SizedBox(
                  height: 94,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    itemCount: _levelsBreakdown.length,
                    itemBuilder: (ctx, idx) {
                      final lvlItem = _levelsBreakdown[idx] as Map<String, dynamic>;
                      final lvl = lvlItem['level_number']?.toString() ?? lvlItem['levelNumber']?.toString() ?? lvlItem['level']?.toString() ?? '2';
                      final amt = lvlItem['total_amount'] ?? lvlItem['totalAmount'] ?? '0';
                      final count = lvlItem['member_count'] ?? lvlItem['memberCount'] ?? '—';

                      return Container(
                        width: 130,
                        margin: const EdgeInsets.only(right: 10),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: AppColors.cardBorder),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'Level $lvl',
                                  style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.primary),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                                  decoration: BoxDecoration(
                                    color: AppColors.primaryLight,
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text('2%', style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.primary)),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '₹$amt',
                              style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.textHeading),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            Text(
                              '$count Members',
                              style: GoogleFonts.inter(fontSize: 10, color: AppColors.textLight),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(height: 16),
              ],

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
                    hintText: 'Search by member name or ID...',
                    hintStyle: GoogleFonts.inter(fontSize: 13, color: AppColors.textLight),
                    prefixIcon: const Icon(Icons.search_rounded, color: AppColors.textMuted, size: 20),
                    border: InputBorder.none,
                    isDense: true,
                  ),
                ),
              ),
              const SizedBox(height: 12),

              // Level Filter Tabs
              SizedBox(
                height: 36,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  children: [
                    _buildLevelFilterTab('All Levels', 'all'),
                    for (int i = 2; i <= 10; i++)
                      Padding(
                        padding: const EdgeInsets.only(left: 6),
                        child: _buildLevelFilterTab('Level $i', '$i'),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Level Income Records
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
                        const Icon(Icons.layers_outlined, size: 48, color: AppColors.textLight),
                        const SizedBox(height: 10),
                        Text(
                          'No level income records found',
                          style: GoogleFonts.poppins(
                            fontWeight: FontWeight.w600,
                            color: AppColors.textHeading,
                          ),
                        ),
                        Text(
                          'Commissions generated from Level 2 to 10 team downlines will show here',
                          style: GoogleFonts.inter(fontSize: 12, color: AppColors.textMuted),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                )
              else
                ..._filteredRecords.map((r) {
                  final rec = r is Map<String, dynamic> ? r : Map<String, dynamic>.from(r as Map);
                  final name = rec['userName'] ?? rec['user_name'] ?? 'Member';
                  final lvl = rec['level'] ?? rec['level_number'] ?? '2';
                  final source = rec['sourceMember'] ?? rec['source_member'] ?? '—';
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
                    ),
                    child: InkWell(
                      onTap: () => _showRecordDetails(rec),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: AppColors.primaryLight,
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  'Level $lvl (2%)',
                                  style: GoogleFonts.inter(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.primary,
                                  ),
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: status == 'paid' ? AppColors.successLight : AppColors.primaryLight,
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  status.toUpperCase(),
                                  style: GoogleFonts.inter(
                                    fontSize: 9,
                                    fontWeight: FontWeight.w700,
                                    color: status == 'paid' ? AppColors.success : AppColors.primary,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            name,
                            style: GoogleFonts.inter(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textHeading,
                            ),
                          ),
                          Text(
                            'Source Downline: $source',
                            style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted),
                          ),
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('Total Level Income', style: GoogleFonts.inter(fontSize: 10, color: AppColors.textLight)),
                                  Text('₹$total', style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textHeading)),
                                ],
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('Paid to Bank', style: GoogleFonts.inter(fontSize: 10, color: AppColors.textLight)),
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

  Widget _buildLevelFilterTab(String label, String value) {
    final isSelected = _selectedLevel == value;
    return GestureDetector(
      onTap: () => setState(() => _selectedLevel = value),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
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
