import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../constants/app_colors.dart';
import '../services/auth_service.dart';
import '../widgets/brand_logo.dart';
import 'login_screen.dart';
import 'network/direct_connections_screen.dart';
import 'network/team_connections_screen.dart';
import 'network/genealogy_tree_screen.dart';
import 'network/referral_link_screen.dart';
import 'income/direct_income_screen.dart';
import 'income/level_income_screen.dart';
import 'rewards/rewards_screen.dart';
import 'payments/transactions_screen.dart';
import 'settings/settings_screen.dart';
import 'support/support_tickets_screen.dart';

class DashboardScreen extends StatefulWidget {
  final Map<String, dynamic> initialUser;

  const DashboardScreen({super.key, required this.initialUser});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  late Map<String, dynamic> _user;
  Map<String, dynamic>? _dashboardStats;
  bool _isLoading = true;
  int _currentTabIndex = 0;

  @override
  void initState() {
    super.initState();
    _user = Map<String, dynamic>.from(widget.initialUser);
    _fetchDashboardData();
  }

  Future<void> _fetchDashboardData() async {
    setState(() => _isLoading = true);
    try {
      final stats = await AuthService.getDashboardStats();
      if (mounted && stats != null) {
        setState(() {
          _dashboardStats = stats;
          if (stats['user'] != null) {
            _user = Map<String, dynamic>.from(stats['user'] as Map);
          }
        });
      }
    } catch (_) {
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _handleLogout() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(
          'Log Out',
          style: GoogleFonts.poppins(fontWeight: FontWeight.w700),
        ),
        content: Text(
          'Are you sure you want to end your current session?',
          style: GoogleFonts.inter(),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: Text(
              'Cancel',
              style: GoogleFonts.inter(color: AppColors.textMuted),
            ),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: Text(
              'Log Out',
              style: GoogleFonts.inter(fontWeight: FontWeight.w700),
            ),
          ),
        ],
      ),
    );

    if (confirm == true) {
      await AuthService.logout();
      if (!mounted) return;
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
        (route) => false,
      );
    }
  }

  void _navigateTo(Widget screen) {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => screen),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        title: const BrandLogo(
          iconSize: 34,
          fontSize: 16,
          showSubtitle: false,
        ),
        actions: [
          Container(
            margin: const EdgeInsets.symmetric(vertical: 12),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: AppColors.successLight,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.successBorder),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                    color: AppColors.success,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 6),
                Text(
                  'Active',
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: AppColors.success,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          IconButton(
            icon: const Icon(Icons.logout_rounded, color: AppColors.error),
            tooltip: 'Logout',
            onPressed: _handleLogout,
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: IndexedStack(
        index: _currentTabIndex,
        children: [
          _buildHomeTab(),
          _buildNetworkHubTab(),
          _buildIncomeHubTab(),
          _buildFinanceHubTab(),
          _buildAccountHubTab(),
        ],
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: AppColors.cardBorder, width: 1)),
        ),
        child: NavigationBar(
          selectedIndex: _currentTabIndex,
          onDestinationSelected: (index) {
            setState(() => _currentTabIndex = index);
          },
          backgroundColor: Colors.white,
          elevation: 0,
          indicatorColor: AppColors.primaryLight,
          labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
          destinations: const [
            NavigationDestination(
              icon: Icon(Icons.dashboard_outlined, color: AppColors.textMuted),
              selectedIcon: Icon(Icons.dashboard_rounded, color: AppColors.primary),
              label: 'Home',
            ),
            NavigationDestination(
              icon: Icon(Icons.hub_outlined, color: AppColors.textMuted),
              selectedIcon: Icon(Icons.hub_rounded, color: AppColors.primary),
              label: 'Network',
            ),
            NavigationDestination(
              icon: Icon(Icons.monetization_on_outlined, color: AppColors.textMuted),
              selectedIcon: Icon(Icons.monetization_on_rounded, color: AppColors.primary),
              label: 'Income',
            ),
            NavigationDestination(
              icon: Icon(Icons.account_balance_wallet_outlined, color: AppColors.textMuted),
              selectedIcon: Icon(Icons.account_balance_wallet_rounded, color: AppColors.primary),
              label: 'Finance',
            ),
            NavigationDestination(
              icon: Icon(Icons.grid_view_outlined, color: AppColors.textMuted),
              selectedIcon: Icon(Icons.grid_view_rounded, color: AppColors.primary),
              label: 'Account',
            ),
          ],
        ),
      ),
    );
  }

  // -------------------------------------------------------------
  // TAB 0: HOME / DASHBOARD OVERVIEW
  // -------------------------------------------------------------
  Widget _buildHomeTab() {
    final kpis = _dashboardStats?['kpis'] as Map<String, dynamic>?;
    final transactions = _dashboardStats?['recentTransactions'] as List<dynamic>? ?? [];

    final String name = _user['name']?.toString() ?? 'Partner User';
    final String userCode = _user['user_code']?.toString() ?? _user['userCode']?.toString() ?? 'CB100201';
    final String email = _user['email']?.toString() ?? '';
    final String rank = _user['rank']?.toString() ?? 'Gold Executive';

    return RefreshIndicator(
      onRefresh: _fetchDashboardData,
      color: AppColors.primary,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // User Profile Card
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    Color(0xFF0F4C81),
                    Color(0xFF0A355C),
                  ],
                ),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF0F4C81).withValues(alpha: 0.25),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 28,
                    backgroundColor: AppColors.secondary,
                    child: Text(
                      name.isNotEmpty ? name[0].toUpperCase() : 'P',
                      style: GoogleFonts.poppins(
                        fontSize: 24,
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
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          email,
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            color: const Color(0xFFCBD5E1),
                          ),
                        ),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                'ID: $userCode',
                                style: GoogleFonts.inter(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: AppColors.secondary.withValues(alpha: 0.3),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.star_rounded, size: 12, color: AppColors.secondary),
                                  const SizedBox(width: 4),
                                  Text(
                                    rank,
                                    style: GoogleFonts.inter(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700,
                                      color: const Color(0xFFFFB366),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),

            // Financial Overview KPIs
            Text(
              'Financial & Network Overview',
              style: GoogleFonts.poppins(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppColors.textHeading,
              ),
            ),
            const SizedBox(height: 12),

            Row(
              children: [
                Expanded(
                  child: _buildKpiCard(
                    title: 'Total Earnings',
                    value: '₹${kpis?['totalEarnings'] ?? 14500}',
                    icon: Icons.account_balance_wallet_rounded,
                    color: AppColors.secondary,
                    badgeText: '+18.4%',
                    badgeColor: AppColors.successLight,
                    badgeTextColor: AppColors.success,
                    onTap: () => _navigateTo(DirectIncomeScreen(user: _user)),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildKpiCard(
                    title: 'Commission Wallet',
                    value: '₹${kpis?['commissionBalance'] ?? 14500}',
                    icon: Icons.payments_rounded,
                    color: AppColors.primary,
                    badgeText: 'Available',
                    badgeColor: AppColors.primaryLight,
                    badgeTextColor: AppColors.primary,
                    onTap: () => _navigateTo(TransactionsScreen(user: _user)),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            Row(
              children: [
                Expanded(
                  child: _buildKpiCard(
                    title: 'Direct Partners',
                    value: '${kpis?['directMembers'] ?? 3}',
                    icon: Icons.person_add_alt_1_rounded,
                    color: const Color(0xFF0284C7),
                    badgeText: 'Active',
                    badgeColor: const Color(0xFFE0F2FE),
                    badgeTextColor: const Color(0xFF0369A1),
                    onTap: () => _navigateTo(DirectConnectionsScreen(user: _user)),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildKpiCard(
                    title: 'Total Network',
                    value: '${kpis?['totalTeamMembers'] ?? 18}',
                    icon: Icons.hub_rounded,
                    color: const Color(0xFF7C3AED),
                    badgeText: 'Downlines',
                    badgeColor: const Color(0xFFF3E8FF),
                    badgeTextColor: const Color(0xFF7C3AED),
                    onTap: () => _navigateTo(TeamConnectionsScreen(user: _user)),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Recent Ledger Transactions
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Recent Transactions',
                  style: GoogleFonts.poppins(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textHeading,
                  ),
                ),
                TextButton(
                  onPressed: () => _navigateTo(TransactionsScreen(user: _user)),
                  child: const Text('View All', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12)),
                ),
              ],
            ),
            const SizedBox(height: 8),

            if (_isLoading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(24),
                  child: CircularProgressIndicator(),
                ),
              )
            else if (transactions.isEmpty)
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.cardBorder),
                ),
                child: Center(
                  child: Text(
                    'No recent transactions found.',
                    style: GoogleFonts.inter(color: AppColors.textMuted),
                  ),
                ),
              )
            else
              ...transactions.take(4).map((tx) {
                final amount = tx['amount']?.toString() ?? '0';
                final net = tx['net']?.toString() ?? amount;
                final type = tx['type']?.toString() ?? 'Commission Payout';
                final date = tx['date']?.toString() ?? '';
                final status = tx['status']?.toString() ?? 'completed';

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
                          color: AppColors.primaryLight,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.receipt_long_rounded, color: AppColors.primary, size: 20),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              type,
                              style: GoogleFonts.inter(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: AppColors.textHeading,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            Text(date, style: GoogleFonts.inter(fontSize: 11, color: AppColors.textLight)),
                          ],
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            '₹$net',
                            style: GoogleFonts.poppins(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: AppColors.secondary,
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.successLight,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              status.toUpperCase(),
                              style: GoogleFonts.inter(
                                fontSize: 9,
                                fontWeight: FontWeight.w700,
                                color: AppColors.success,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                );
              }),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  // -------------------------------------------------------------
  // TAB 1: NETWORK SECTION HUB (REVAMPED 2X2 GRID & HERO BANNER)
  // -------------------------------------------------------------
  Widget _buildNetworkHubTab() {
    final kpis = _dashboardStats?['kpis'] as Map<String, dynamic>?;
    final directCount = kpis?['directMembers'] ?? 3;
    final totalTeam = kpis?['totalTeamMembers'] ?? 18;
    final userCode = _user['user_code']?.toString() ?? _user['userCode']?.toString() ?? 'CB100201';

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Premium Gradient Hero Header
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF0F4C81), Color(0xFF1E3A8A)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(22),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF0F4C81).withValues(alpha: 0.25),
                  blurRadius: 16,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(Icons.hub_rounded, color: Colors.white, size: 24),
                        ),
                        const SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Network Matrix',
                              style: GoogleFonts.poppins(
                                fontSize: 18,
                                fontWeight: FontWeight.w800,
                                color: Colors.white,
                              ),
                            ),
                            Text(
                              '10-Tier Downlines Structure',
                              style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFFCBD5E1)),
                            ),
                          ],
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.secondary,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        '2% / Level',
                        style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w800, color: Colors.white),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                const Divider(color: Colors.white24, height: 1),
                const SizedBox(height: 14),
                Row(
                  children: [
                    Expanded(
                      child: _buildBannerStatItem('Direct Partners', '$directCount Active'),
                    ),
                    Container(width: 1, height: 32, color: Colors.white24),
                    Expanded(
                      child: _buildBannerStatItem('Total Network', '$totalTeam Members'),
                    ),
                    Container(width: 1, height: 32, color: Colors.white24),
                    Expanded(
                      child: _buildBannerStatItem('Max Depth', '10 Levels'),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),

          Text(
            'Explore Network Modules',
            style: GoogleFonts.poppins(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: AppColors.textHeading,
            ),
          ),
          const SizedBox(height: 12),

          // 2x2 Grid Layout for Options
          Row(
            children: [
              Expanded(
                child: _buildGridFeatureCard(
                  title: 'Direct Partners',
                  badge: 'Level 1',
                  description: 'Personal associates & active status',
                  icon: Icons.person_add_alt_1_rounded,
                  color: const Color(0xFF0284C7),
                  onTap: () => _navigateTo(DirectConnectionsScreen(user: _user)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildGridFeatureCard(
                  title: '10-Level Team',
                  badge: '2% Override',
                  description: 'Full team downlines & group volume',
                  icon: Icons.groups_rounded,
                  color: const Color(0xFF7C3AED),
                  onTap: () => _navigateTo(TeamConnectionsScreen(user: _user)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildGridFeatureCard(
                  title: 'Genealogy Tree',
                  badge: 'Hierarchy',
                  description: 'Interactive unilevel visual tree',
                  icon: Icons.account_tree_rounded,
                  color: const Color(0xFF16A34A),
                  onTap: () => _navigateTo(GenealogyTreeScreen(user: _user)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildGridFeatureCard(
                  title: 'Referral Tools',
                  badge: 'Share & Earn',
                  description: 'Promoter links, QR & templates',
                  icon: Icons.share_rounded,
                  color: AppColors.secondary,
                  onTap: () => _navigateTo(ReferralLinkScreen(user: _user)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),

          // Quick Referral Banner
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.cardBorder),
            ),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: AppColors.secondaryLight,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.qr_code_rounded, color: AppColors.secondary, size: 24),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Your Sponsor ID: $userCode',
                        style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textHeading),
                      ),
                      Text(
                        'Share with prospective business partners',
                        style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted),
                      ),
                    ],
                  ),
                ),
                ElevatedButton(
                  onPressed: () {
                    Clipboard.setData(ClipboardData(text: 'https://vyaparadnet.com/register?ref=$userCode'));
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Referral link copied!'), backgroundColor: AppColors.primary),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  ),
                  child: const Text('Copy', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  // -------------------------------------------------------------
  // TAB 2: INCOME SECTION HUB (REVAMPED HERO WITH CARDS)
  // -------------------------------------------------------------
  Widget _buildIncomeHubTab() {
    final kpis = _dashboardStats?['kpis'] as Map<String, dynamic>?;
    final totalEarnings = kpis?['totalEarnings'] ?? '14,500';
    final wallet = kpis?['commissionBalance'] ?? '14,500';

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Premium Sunset Gradient Header
          Container(
            padding: const EdgeInsets.all(22),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFFFF7A00), Color(0xFFEA580C)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(22),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFFFF7A00).withValues(alpha: 0.28),
                  blurRadius: 16,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'TOTAL EARNINGS',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 1.0,
                        color: Colors.white70,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        'Direct from DB',
                        style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: Colors.white),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  '₹$totalEarnings',
                  style: GoogleFonts.poppins(
                    fontSize: 32,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.account_balance_wallet_rounded, color: Colors.white, size: 18),
                          const SizedBox(width: 8),
                          Text(
                            'Available in Wallet:',
                            style: GoogleFonts.inter(fontSize: 12, color: Colors.white70),
                          ),
                        ],
                      ),
                      Text(
                        '₹$wallet',
                        style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w800, color: Colors.white),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          Text(
            'Income Streams & Ledgers',
            style: GoogleFonts.poppins(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: AppColors.textHeading,
            ),
          ),
          const SizedBox(height: 12),

          // Direct Income Big Card
          _buildRichStreamCard(
            title: 'Direct Income',
            subtitle: 'Commissions generated directly from personal downlines and packages',
            badge: 'Level 1 Direct',
            badgeColor: AppColors.primary,
            icon: Icons.payments_rounded,
            iconBg: AppColors.primaryLight,
            iconColor: AppColors.primary,
            actionLabel: 'View Direct Income Orders →',
            onTap: () => _navigateTo(DirectIncomeScreen(user: _user)),
          ),
          const SizedBox(height: 14),

          // Level Income Big Card
          _buildRichStreamCard(
            title: 'Level Income',
            subtitle: '2% commission per tier across Level 2 to Level 10 network team downlines',
            badge: '10-Level Override',
            badgeColor: const Color(0xFF16A34A),
            icon: Icons.layers_rounded,
            iconBg: AppColors.successLight,
            iconColor: AppColors.success,
            actionLabel: 'View Level Breakdown (L2 - L10) →',
            onTap: () => _navigateTo(LevelIncomeScreen(user: _user)),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  // -------------------------------------------------------------
  // TAB 3: FINANCE SECTION HUB (REVAMPED HERO DUAL WALLET)
  // -------------------------------------------------------------
  Widget _buildFinanceHubTab() {
    final kpis = _dashboardStats?['kpis'] as Map<String, dynamic>?;
    final wallet = kpis?['commissionBalance'] ?? '14,500';

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Dual Balance Card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF065F46), Color(0xFF047857)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(22),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF047857).withValues(alpha: 0.25),
                  blurRadius: 16,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'FINANCIAL ASSETS & REWARDS',
                      style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.0, color: Colors.white70),
                    ),
                    Text(
                      'TDS 5% Section 194H',
                      style: GoogleFonts.inter(fontSize: 10, color: const Color(0xFF86EFAC), fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.diamond_rounded, color: Color(0xFF38BDF8), size: 18),
                              const SizedBox(width: 4),
                              Text('Diamonds', style: GoogleFonts.inter(fontSize: 12, color: Colors.white70)),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '120 💎',
                            style: GoogleFonts.poppins(fontSize: 22, fontWeight: FontWeight.w800, color: Colors.white),
                          ),
                          Text('≈ ₹12,000 Gifts', style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF86EFAC))),
                        ],
                      ),
                    ),
                    Container(width: 1, height: 50, color: Colors.white24),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.account_balance_wallet_rounded, color: Colors.white, size: 18),
                              const SizedBox(width: 4),
                              Text('Cash Wallet', style: GoogleFonts.inter(fontSize: 12, color: Colors.white70)),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '₹$wallet',
                            style: GoogleFonts.poppins(fontSize: 22, fontWeight: FontWeight.w800, color: Colors.white),
                          ),
                          Text('Available to withdraw', style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF86EFAC))),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          Text(
            'Financial Services & Stores',
            style: GoogleFonts.poppins(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: AppColors.textHeading,
            ),
          ),
          const SizedBox(height: 12),

          // Rewards Card
          _buildRichStreamCard(
            title: 'Rewards & Diamond Store',
            subtitle: 'Redeem laptops, smartphones, motorbikes & milestone luxury gifts with your diamonds',
            badge: 'Milestone Gifts 🎁',
            badgeColor: const Color(0xFF0284C7),
            icon: Icons.card_giftcard_rounded,
            iconBg: const Color(0xFFE0F2FE),
            iconColor: const Color(0xFF0284C7),
            actionLabel: 'Browse Available Rewards Catalog →',
            onTap: () => _navigateTo(RewardsScreen(user: _user)),
          ),
          const SizedBox(height: 14),

          // Payouts Card
          _buildRichStreamCard(
            title: 'Payouts & Transaction History',
            subtitle: 'Review withdrawal statements, Section 194H TDS deductions, UTRs & purchase invoices',
            badge: 'Direct Settlements ₹',
            badgeColor: AppColors.primary,
            icon: Icons.receipt_long_rounded,
            iconBg: AppColors.primaryLight,
            iconColor: AppColors.primary,
            actionLabel: 'View Payout History & Request Withdrawal →',
            onTap: () => _navigateTo(TransactionsScreen(user: _user)),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  // -------------------------------------------------------------
  // TAB 4: ACCOUNT & SETTINGS HUB (REVAMPED PROFILE HERO & GROUPED TILES)
  // -------------------------------------------------------------
  Widget _buildAccountHubTab() {
    final String name = _user['name']?.toString() ?? 'Partner Account';
    final String userCode = _user['user_code']?.toString() ?? _user['userCode']?.toString() ?? 'CB100201';
    final String email = _user['email']?.toString() ?? '';
    final String rank = _user['rank']?.toString() ?? 'Gold Executive';
    final String kycStatus = _user['kyc_status']?.toString().toLowerCase() ?? 'verified';
    final bool isKyc = kycStatus == 'verified' || kycStatus == 'approved';

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Profile Hero Card
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.cardBorder),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.02),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 30,
                  backgroundColor: AppColors.primary,
                  child: Text(
                    name.isNotEmpty ? name[0].toUpperCase() : 'P',
                    style: GoogleFonts.poppins(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        name,
                        style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textHeading),
                      ),
                      Text(email, style: GoogleFonts.inter(fontSize: 12, color: AppColors.textMuted)),
                      const SizedBox(height: 6),
                      Wrap(
                        spacing: 6,
                        runSpacing: 4,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.primaryLight,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              'ID: $userCode',
                              style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.primary),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.secondaryLight,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              rank,
                              style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.secondary),
                            ),
                          ),
                          GestureDetector(
                            onTap: () => _navigateTo(SettingsScreen(user: _user, initialTabIndex: 2)),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                              decoration: BoxDecoration(
                                color: isKyc ? AppColors.successLight : AppColors.warningLight,
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(isKyc ? Icons.verified_rounded : Icons.pending_rounded, size: 10, color: isKyc ? AppColors.success : AppColors.warning),
                                  const SizedBox(width: 3),
                                  Text(
                                    isKyc ? 'KYC Verified' : 'KYC Pending',
                                    style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: isKyc ? AppColors.success : AppColors.warning),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Group 1: Account Settings
          _buildGroupHeader('PROFILE & SECURITY'),
          _buildSettingsGroup([
            _buildGroupedTile(
              title: 'Personal Profile Details',
              subtitle: 'Full name, contact phone, street address & city',
              icon: Icons.person_outline_rounded,
              iconColor: AppColors.primary,
              onTap: () => _navigateTo(SettingsScreen(user: _user, initialTabIndex: 0)),
            ),
            const Divider(height: 1, indent: 56),
            _buildGroupedTile(
              title: 'Security & Password',
              subtitle: 'Change login password & manage session security',
              icon: Icons.lock_outline_rounded,
              iconColor: const Color(0xFF64748B),
              onTap: () => _navigateTo(SettingsScreen(user: _user, initialTabIndex: 1)),
            ),
          ]),
          const SizedBox(height: 16),

          // Group 2: Financial Setup
          _buildGroupHeader('STATUTORY & BANKING'),
          _buildSettingsGroup([
            _buildGroupedTile(
              title: 'Statutory KYC Verification',
              subtitle: 'PAN card and 12-digit Aadhaar UID verification',
              icon: Icons.fingerprint_rounded,
              iconColor: const Color(0xFF16A34A),
              badge: isKyc ? 'Verified' : 'Pending',
              badgeColor: isKyc ? AppColors.success : AppColors.warning,
              onTap: () => _navigateTo(SettingsScreen(user: _user, initialTabIndex: 2)),
            ),
            const Divider(height: 1, indent: 56),
            _buildGroupedTile(
              title: 'Bank & UPI Payout Accounts',
              subtitle: 'Manage bank accounts and primary UPI payment IDs',
              icon: Icons.account_balance_rounded,
              iconColor: const Color(0xFF7C3AED),
              onTap: () => _navigateTo(SettingsScreen(user: _user, initialTabIndex: 3)),
            ),
          ]),
          const SizedBox(height: 16),

          // Group 3: Support
          _buildGroupHeader('SUPPORT & HELPDESK'),
          _buildSettingsGroup([
            _buildGroupedTile(
              title: 'Support Tickets Desk',
              subtitle: 'Create support inquiries and chat with our helpdesk',
              icon: Icons.support_agent_rounded,
              iconColor: AppColors.secondary,
              badge: 'Live Help',
              badgeColor: AppColors.secondary,
              onTap: () => _navigateTo(SupportTicketsScreen(user: _user)),
            ),
          ]),
          const SizedBox(height: 16),

          // Logout Action Tile
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.errorBorder),
            ),
            child: ListTile(
              leading: Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: AppColors.errorLight,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.logout_rounded, color: AppColors.error, size: 20),
              ),
              title: Text(
                'Log Out of Account',
                style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.error),
              ),
              subtitle: Text(
                'End current session securely',
                style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted),
              ),
              trailing: const Icon(Icons.arrow_forward_ios_rounded, color: AppColors.error, size: 14),
              onTap: _handleLogout,
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  // -------------------------------------------------------------
  // REUSABLE MODERN WIDGET BUILDERS
  // -------------------------------------------------------------
  Widget _buildBannerStatItem(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: GoogleFonts.poppins(
            fontSize: 13,
            fontWeight: FontWeight.w800,
            color: Colors.white,
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: GoogleFonts.inter(fontSize: 10, color: const Color(0xFFCBD5E1)),
        ),
      ],
    );
  }

  Widget _buildGridFeatureCard({
    required String title,
    required String badge,
    required String description,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.cardBorder),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(icon, color: color, size: 22),
                  ),
                  Flexible(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: color.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        badge,
                        style: GoogleFonts.inter(
                          fontSize: 9,
                          fontWeight: FontWeight.w800,
                          color: color,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Text(
                title,
                style: GoogleFonts.poppins(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textHeading,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                description,
                style: GoogleFonts.inter(
                  fontSize: 11,
                  color: AppColors.textMuted,
                  height: 1.3,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Text(
                    'Open Module',
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: color,
                    ),
                  ),
                  const SizedBox(width: 4),
                  Icon(Icons.arrow_forward_rounded, size: 12, color: color),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRichStreamCard({
    required String title,
    required String subtitle,
    required String badge,
    required Color badgeColor,
    required IconData icon,
    required Color iconBg,
    required Color iconColor,
    required String actionLabel,
    required VoidCallback onTap,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.cardBorder),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 46,
                    height: 46,
                    decoration: BoxDecoration(
                      color: iconBg,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Icon(icon, color: iconColor, size: 24),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Wrap(
                          crossAxisAlignment: WrapCrossAlignment.center,
                          spacing: 6,
                          runSpacing: 4,
                          children: [
                            Text(
                              title,
                              style: GoogleFonts.poppins(
                                fontSize: 15,
                                fontWeight: FontWeight.w700,
                                color: AppColors.textHeading,
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                              decoration: BoxDecoration(
                                color: badgeColor.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                badge,
                                style: GoogleFonts.inter(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  color: badgeColor,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 3),
                        Text(
                          subtitle,
                          style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted, height: 1.3),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              const Divider(height: 1),
              const SizedBox(height: 10),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    actionLabel,
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: AppColors.primary,
                    ),
                  ),
                  const Icon(Icons.arrow_forward_ios_rounded, size: 12, color: AppColors.primary),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildGroupHeader(String label) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 8),
      child: Text(
        label,
        style: GoogleFonts.inter(
          fontSize: 11,
          fontWeight: FontWeight.w800,
          color: AppColors.textLight,
          letterSpacing: 0.8,
        ),
      ),
    );
  }

  Widget _buildSettingsGroup(List<Widget> children) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Column(children: children),
    );
  }

  Widget _buildGroupedTile({
    required String title,
    required String subtitle,
    required IconData icon,
    required Color iconColor,
    required VoidCallback onTap,
    String? badge,
    Color? badgeColor,
  }) {
    return ListTile(
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      leading: Container(
        width: 38,
        height: 38,
        decoration: BoxDecoration(
          color: iconColor.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: iconColor, size: 20),
      ),
      title: Row(
        children: [
          Expanded(
            child: Text(
              title,
              style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textHeading),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          if (badge != null) ...[
            const SizedBox(width: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
              decoration: BoxDecoration(
                color: (badgeColor ?? iconColor).withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                badge,
                style: GoogleFonts.inter(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  color: badgeColor ?? iconColor,
                ),
              ),
            ),
          ],
        ],
      ),
      subtitle: Text(
        subtitle,
        style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
      trailing: const Icon(Icons.arrow_forward_ios_rounded, color: AppColors.textLight, size: 14),
    );
  }

  Widget _buildKpiCard({
    required String title,
    required String value,
    required IconData icon,
    required Color color,
    required String badgeText,
    required Color badgeColor,
    required Color badgeTextColor,
    VoidCallback? onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.cardBorder),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.02),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(icon, color: color, size: 20),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                  decoration: BoxDecoration(
                    color: badgeColor,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    badgeText,
                    style: GoogleFonts.inter(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: badgeTextColor,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              value,
              style: GoogleFonts.poppins(
                fontSize: 20,
                fontWeight: FontWeight.w800,
                color: AppColors.textHeading,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              title,
              style: GoogleFonts.inter(
                fontSize: 12,
                color: AppColors.textMuted,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
