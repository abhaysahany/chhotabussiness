import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../constants/app_colors.dart';
import '../../services/network_service.dart';
import '../../widgets/app_drawer.dart';

class TeamConnectionsScreen extends StatefulWidget {
  final Map<String, dynamic> user;

  const TeamConnectionsScreen({super.key, required this.user});

  @override
  State<TeamConnectionsScreen> createState() => _TeamConnectionsScreenState();
}

class _TeamConnectionsScreenState extends State<TeamConnectionsScreen> {
  bool _isLoading = true;
  String? _error;
  List<dynamic> _teamMembers = [];
  Map<String, dynamic>? _summary;

  String _searchQuery = '';
  String _selectedLevel = 'all';

  @override
  void initState() {
    super.initState();
    _fetchTeam();
  }

  Future<void> _fetchTeam() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final userCode = widget.user['user_code']?.toString() ?? widget.user['userCode']?.toString();
      final res = await NetworkService.getTeamConnections(userCode: userCode);
      if (mounted) {
        setState(() {
          _teamMembers = res['teamMembers'] as List<dynamic>? ?? [];
          _summary = res['summary'] as Map<String, dynamic>?;
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
    return _teamMembers.where((m) {
      final name = m['name']?.toString().toLowerCase() ?? '';
      final code = m['id']?.toString().toLowerCase() ?? '';
      final query = _searchQuery.toLowerCase();
      final matchesQuery = query.isEmpty || name.contains(query) || code.contains(query);

      final lvl = m['level']?.toString() ?? '1';
      final matchesLevel = _selectedLevel == 'all' || lvl == _selectedLevel;

      return matchesQuery && matchesLevel;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final totalTeam = _summary?['totalTeamCount'] ?? _teamMembers.length;
    final activeCount = _summary?['activeCount'] ?? _teamMembers.where((m) => m['status'] == 'active').length;
    final totalVolume = _summary?['totalVolumeFormatted']?.toString() ?? '₹0';

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: const BackButton(),
        title: Text(
          'Team Connections (10-Levels)',
          style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 17),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _fetchTeam,
        color: AppColors.primary,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Summary Metrics
              Row(
                children: [
                  Expanded(
                    child: _buildMetric(
                      'Total Team',
                      '$totalTeam',
                      Icons.groups_rounded,
                      AppColors.primary,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _buildMetric(
                      'Active Downlines',
                      '$activeCount',
                      Icons.verified_user_rounded,
                      AppColors.success,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _buildMetric(
                      'Group Volume',
                      totalVolume,
                      Icons.trending_up_rounded,
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
                    hintText: 'Search by downline name or ID...',
                    hintStyle: GoogleFonts.inter(fontSize: 13, color: AppColors.textLight),
                    prefixIcon: const Icon(Icons.search_rounded, color: AppColors.textMuted, size: 20),
                    border: InputBorder.none,
                    isDense: true,
                  ),
                ),
              ),
              const SizedBox(height: 12),

              // Level Selector Horizontal Scroll
              SizedBox(
                height: 38,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  children: [
                    _buildLevelPill('All Levels', 'all'),
                    for (int i = 1; i <= 10; i++)
                      Padding(
                        padding: const EdgeInsets.only(left: 6),
                        child: _buildLevelPill('Level $i (2%)', '$i'),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Team Members List
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
                  child: Text(
                    _error!,
                    textAlign: TextAlign.center,
                    style: GoogleFonts.inter(color: AppColors.error),
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
                        const Icon(Icons.people_alt_outlined, size: 48, color: AppColors.textLight),
                        const SizedBox(height: 10),
                        Text(
                          'No team members found for this level',
                          style: GoogleFonts.poppins(
                            fontWeight: FontWeight.w600,
                            color: AppColors.textHeading,
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              else
                ..._filteredMembers.map((m) {
                  final memberMap = m is Map<String, dynamic> ? m : Map<String, dynamic>.from(m as Map);
                  final name = memberMap['name']?.toString() ?? 'Team Member';
                  final code = memberMap['id']?.toString() ?? '—';
                  final level = memberMap['level']?.toString() ?? '1';
                  final sponsor = memberMap['sponsorName']?.toString() ?? memberMap['sponsorId']?.toString() ?? 'Direct';
                  final rank = memberMap['rank']?.toString() ?? 'Bronze';
                  final status = memberMap['status']?.toString().toLowerCase() ?? 'active';
                  final personalPv = memberMap['personalPv']?.toString() ?? '0';

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
                    child: Row(
                      children: [
                        Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: _getLevelColor(level).withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Center(
                            child: Text(
                              'L$level',
                              style: GoogleFonts.poppins(
                                fontSize: 14,
                                fontWeight: FontWeight.w800,
                                color: _getLevelColor(level),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                name,
                                style: GoogleFonts.inter(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.textHeading,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'ID: $code • Rank: $rank',
                                style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted),
                              ),
                              Text(
                                'Sponsor: $sponsor • PV: $personalPv',
                                style: GoogleFonts.inter(fontSize: 11, color: AppColors.textLight),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                          decoration: BoxDecoration(
                            color: status == 'active' ? AppColors.successLight : AppColors.errorLight,
                            borderRadius: BorderRadius.circular(6),
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
                  );
                }),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Color _getLevelColor(String level) {
    final lvl = int.tryParse(level) ?? 1;
    switch (lvl) {
      case 1:
        return const Color(0xFF0F4C81);
      case 2:
        return const Color(0xFFFF7A00);
      case 3:
        return const Color(0xFF16A34A);
      case 4:
        return const Color(0xFF7C3AED);
      case 5:
        return const Color(0xFF0284C7);
      case 6:
        return const Color(0xFFD97706);
      case 7:
        return const Color(0xFFE11D48);
      default:
        return const Color(0xFF475569);
    }
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

  Widget _buildLevelPill(String label, String value) {
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
