import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../constants/app_colors.dart';
import '../../services/network_service.dart';
import '../../widgets/app_drawer.dart';

class DirectConnectionsScreen extends StatefulWidget {
  final Map<String, dynamic> user;

  const DirectConnectionsScreen({super.key, required this.user});

  @override
  State<DirectConnectionsScreen> createState() => _DirectConnectionsScreenState();
}

class _DirectConnectionsScreenState extends State<DirectConnectionsScreen> {
  bool _isLoading = true;
  String? _error;
  List<dynamic> _directMembers = [];
  Map<String, dynamic>? _stats;

  String _searchQuery = '';
  String _statusFilter = 'all';

  @override
  void initState() {
    super.initState();
    _fetchDirects();
  }

  Future<void> _fetchDirects() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final userCode = widget.user['user_code']?.toString() ?? widget.user['userCode']?.toString();
      final res = await NetworkService.getDirectConnections(userCode: userCode);
      if (mounted) {
        setState(() {
          _directMembers = res['directMembers'] as List<dynamic>? ?? [];
          _stats = res['stats'] as Map<String, dynamic>?;
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

  List<dynamic> get _filteredMembers {
    return _directMembers.where((m) {
      final name = m['name']?.toString().toLowerCase() ?? '';
      final code = m['id']?.toString().toLowerCase() ?? '';
      final query = _searchQuery.toLowerCase();
      final matchesQuery = query.isEmpty || name.contains(query) || code.contains(query);

      final status = m['status']?.toString().toLowerCase() ?? 'active';
      final matchesStatus = _statusFilter == 'all' || status == _statusFilter;

      return matchesQuery && matchesStatus;
    }).toList();
  }

  void _showMemberDetail(Map<String, dynamic> member) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        final name = member['name']?.toString() ?? 'Member';
        final code = member['id']?.toString() ?? '—';
        final email = member['email']?.toString() ?? '—';
        final phone = member['phone']?.toString() ?? '—';
        final rank = member['rank']?.toString() ?? 'Bronze';
        final joiningDate = member['joiningDate']?.toString() ?? '—';
        final status = member['status']?.toString() ?? 'active';
        final teamTurnover = member['teamTurnover']?.toString() ?? '₹0';
        final bonus = member['level1Bonus']?.toString() ?? '₹0';
        final l2Count = member['level2Count']?.toString() ?? '0';

        return Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 28,
          ),
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
              Row(
                children: [
                  CircleAvatar(
                    radius: 26,
                    backgroundColor: AppColors.secondary,
                    child: Text(
                      name.isNotEmpty ? name[0].toUpperCase() : 'M',
                      style: GoogleFonts.poppins(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          name,
                          style: GoogleFonts.poppins(
                            fontSize: 17,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textHeading,
                          ),
                        ),
                        Text(
                          'ID: $code • $rank',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            color: AppColors.primary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: status == 'active' ? AppColors.successLight : AppColors.errorLight,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      status.toUpperCase(),
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: status == 'active' ? AppColors.success : AppColors.error,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              const Divider(height: 1),
              const SizedBox(height: 16),
              _buildDetailRow('Email Address', email, Icons.email_outlined),
              _buildDetailRow('Phone Number', phone, Icons.phone_outlined),
              _buildDetailRow('Joining Date', joiningDate, Icons.calendar_today_outlined),
              _buildDetailRow('Level 2 Downlines', '$l2Count Members', Icons.people_outline),
              _buildDetailRow('Team Turnover', teamTurnover, Icons.trending_up_rounded),
              _buildDetailRow('Level 1 Bonus', bonus, Icons.account_balance_wallet_outlined),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(ctx),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  child: Text('Close', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildDetailRow(String label, String value, IconData icon) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppColors.textMuted),
          const SizedBox(width: 10),
          Text(
            label,
            style: GoogleFonts.inter(fontSize: 12, color: AppColors.textMuted),
          ),
          const Spacer(),
          Text(
            value,
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: AppColors.textHeading,
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final totalCount = _stats?['totalDirectCount'] ?? _directMembers.length;
    final activeCount = _stats?['activeCount'] ?? _directMembers.where((m) => m['status'] == 'active').length;
    final turnover = _stats?['totalTurnoverFormatted']?.toString() ?? '₹0';
    final bonus = _stats?['totalBonusFormatted']?.toString() ?? '₹0';

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: const BackButton(),
        title: Text(
          'Direct Connections',
          style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 18),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _fetchDirects,
        color: AppColors.primary,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Summary Stat Cards
              Row(
                children: [
                  Expanded(
                    child: _buildMetricCard(
                      'Total Directs',
                      '$totalCount',
                      Icons.person_add_alt_1_rounded,
                      AppColors.primary,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildMetricCard(
                      'Active Partners',
                      '$activeCount',
                      Icons.check_circle_outline_rounded,
                      AppColors.success,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _buildMetricCard(
                      'Team Turnover',
                      turnover,
                      Icons.trending_up_rounded,
                      AppColors.secondary,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildMetricCard(
                      'Total Bonus',
                      bonus,
                      Icons.account_balance_wallet_rounded,
                      const Color(0xFF7C3AED),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),

              // Search & Filter
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
                    hintText: 'Search by partner name or ID...',
                    hintStyle: GoogleFonts.inter(fontSize: 13, color: AppColors.textLight),
                    prefixIcon: const Icon(Icons.search_rounded, color: AppColors.textMuted, size: 20),
                    border: InputBorder.none,
                    isDense: true,
                  ),
                ),
              ),
              const SizedBox(height: 10),

              // Status Filter Tabs
              Row(
                children: [
                  _buildFilterChip('All', 'all'),
                  const SizedBox(width: 8),
                  _buildFilterChip('Active', 'active'),
                  const SizedBox(width: 8),
                  _buildFilterChip('Inactive', 'inactive'),
                ],
              ),
              const SizedBox(height: 16),

              // Members List
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
                  child: Column(
                    children: [
                      const Icon(Icons.error_outline, color: AppColors.error, size: 36),
                      const SizedBox(height: 8),
                      Text(
                        _error!,
                        textAlign: TextAlign.center,
                        style: GoogleFonts.inter(color: AppColors.error),
                      ),
                      const SizedBox(height: 12),
                      ElevatedButton(
                        onPressed: _fetchDirects,
                        style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
                        child: const Text('Try Again', style: TextStyle(color: Colors.white)),
                      ),
                    ],
                  ),
                )
              else if (_filteredMembers.isEmpty)
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
                        const Icon(Icons.people_outline_rounded, size: 48, color: AppColors.textLight),
                        const SizedBox(height: 10),
                        Text(
                          'No direct connections found',
                          style: GoogleFonts.poppins(
                            fontWeight: FontWeight.w600,
                            color: AppColors.textHeading,
                          ),
                        ),
                        Text(
                          'Share your referral link to onboard new partners',
                          style: GoogleFonts.inter(fontSize: 12, color: AppColors.textMuted),
                        ),
                      ],
                    ),
                  ),
                )
              else
                ..._filteredMembers.map((m) {
                  final memberMap = m is Map<String, dynamic> ? m : Map<String, dynamic>.from(m as Map);
                  final name = memberMap['name']?.toString() ?? 'Partner Member';
                  final code = memberMap['id']?.toString() ?? '—';
                  final rank = memberMap['rank']?.toString() ?? 'Bronze';
                  final status = memberMap['status']?.toString().toLowerCase() ?? 'active';
                  final turnoverVal = memberMap['teamTurnover']?.toString() ?? '₹0';
                  final bonusVal = memberMap['level1Bonus']?.toString() ?? '₹0';
                  final kyc = memberMap['kycVerified'] == true;

                  return Container(
                    margin: const EdgeInsets.only(bottom: 10),
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
                    child: ListTile(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      onTap: () => _showMemberDetail(memberMap),
                      leading: CircleAvatar(
                        radius: 22,
                        backgroundColor: AppColors.primaryLight,
                        child: Text(
                          name.isNotEmpty ? name[0].toUpperCase() : 'P',
                          style: GoogleFonts.poppins(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                      title: Row(
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
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: status == 'active' ? AppColors.successLight : AppColors.errorLight,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              status.toUpperCase(),
                              style: GoogleFonts.inter(
                                fontSize: 9,
                                fontWeight: FontWeight.w700,
                                color: status == 'active' ? AppColors.success : AppColors.error,
                              ),
                            ),
                          ),
                        ],
                      ),
                      subtitle: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const SizedBox(height: 3),
                          Row(
                            children: [
                              Text(
                                'ID: $code',
                                style: GoogleFonts.inter(
                                  fontSize: 11,
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                '• $rank',
                                style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted),
                              ),
                              if (kyc) ...[
                                const SizedBox(width: 6),
                                const Icon(Icons.verified_rounded, size: 14, color: AppColors.success),
                              ],
                            ],
                          ),
                          const SizedBox(height: 4),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Turnover: $turnoverVal',
                                style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted),
                              ),
                              Text(
                                'Bonus: $bonusVal',
                                style: GoogleFonts.inter(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.secondary,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                      trailing: const Icon(Icons.chevron_right_rounded, color: AppColors.textLight),
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

  Widget _buildMetricCard(String title, String value, IconData icon, Color color) {
    return Container(
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
                title,
                style: GoogleFonts.inter(
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                  color: AppColors.textMuted,
                ),
              ),
              Icon(icon, size: 16, color: color),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: GoogleFonts.poppins(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: AppColors.textHeading,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String value) {
    final isSelected = _statusFilter == value;
    return GestureDetector(
      onTap: () => setState(() => _statusFilter = value),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isSelected ? AppColors.primary : AppColors.cardBorder),
        ),
        child: Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
            color: isSelected ? Colors.white : AppColors.textMuted,
          ),
        ),
      ),
    );
  }
}
