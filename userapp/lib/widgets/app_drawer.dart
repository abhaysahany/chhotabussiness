import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../constants/app_colors.dart';
import '../services/auth_service.dart';
import '../screens/login_screen.dart';
import '../screens/network/direct_connections_screen.dart';
import '../screens/network/team_connections_screen.dart';
import '../screens/network/genealogy_tree_screen.dart';
import '../screens/network/referral_link_screen.dart';
import '../screens/income/direct_income_screen.dart';
import '../screens/income/level_income_screen.dart';
import '../screens/rewards/rewards_screen.dart';
import '../screens/payments/transactions_screen.dart';
import '../screens/settings/settings_screen.dart';
import '../screens/support/support_tickets_screen.dart';

class AppDrawer extends StatelessWidget {
  final Map<String, dynamic> user;
  final String activeRoute;

  const AppDrawer({
    super.key,
    required this.user,
    this.activeRoute = 'dashboard',
  });

  Future<void> _handleLogout(BuildContext context) async {
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

    if (confirm == true && context.mounted) {
      await AuthService.logout();
      if (!context.mounted) return;
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
        (route) => false,
      );
    }
  }

  void _navigate(BuildContext context, Widget screen, String routeName) {
    Navigator.of(context).pop(); // Close drawer
    if (activeRoute == routeName) return;
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => screen),
    );
  }

  @override
  Widget build(BuildContext context) {
    final String name = user['name']?.toString() ?? 'Member';
    final String email = user['email']?.toString() ?? '';
    final String userCode = user['user_code']?.toString() ?? user['userCode']?.toString() ?? '';
    final String rank = user['rank']?.toString() ?? 'Member';

    return Drawer(
      backgroundColor: Colors.white,
      child: SafeArea(
        child: Column(
          children: [
            // User Header
            Container(
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    Color(0xFF0F4C81),
                    Color(0xFF0A355C),
                  ],
                ),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 26,
                    backgroundColor: AppColors.secondary,
                    child: Text(
                      name.isNotEmpty ? name[0].toUpperCase() : 'P',
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
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          email,
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            color: const Color(0xFFCBD5E1),
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.18),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                userCode,
                                style: GoogleFonts.inter(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                              decoration: BoxDecoration(
                                color: AppColors.secondary.withValues(alpha: 0.3),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                rank,
                                style: GoogleFonts.inter(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  color: const Color(0xFFFFB366),
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

            // Scrollable Menu List
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(vertical: 8),
                children: [
                  _buildNavItem(
                    context,
                    icon: Icons.dashboard_rounded,
                    title: 'Dashboard',
                    routeName: 'dashboard',
                    onTap: () => Navigator.of(context).pop(),
                  ),

                  _buildSectionHeader('NETWORK & CONNECTIONS'),
                  _buildNavItem(
                    context,
                    icon: Icons.person_add_alt_1_rounded,
                    title: 'Direct Connections',
                    routeName: 'direct_connections',
                    onTap: () => _navigate(
                      context,
                      DirectConnectionsScreen(user: user),
                      'direct_connections',
                    ),
                  ),
                  _buildNavItem(
                    context,
                    icon: Icons.groups_rounded,
                    title: 'Team Connections (10-Levels)',
                    routeName: 'team_connections',
                    onTap: () => _navigate(
                      context,
                      TeamConnectionsScreen(user: user),
                      'team_connections',
                    ),
                  ),
                  _buildNavItem(
                    context,
                    icon: Icons.account_tree_rounded,
                    title: 'Genealogy Tree',
                    routeName: 'genealogy_tree',
                    onTap: () => _navigate(
                      context,
                      GenealogyTreeScreen(user: user),
                      'genealogy_tree',
                    ),
                  ),
                  _buildNavItem(
                    context,
                    icon: Icons.share_rounded,
                    title: 'Referral Link',
                    routeName: 'referral_link',
                    onTap: () => _navigate(
                      context,
                      ReferralLinkScreen(user: user),
                      'referral_link',
                    ),
                  ),

                  _buildSectionHeader('MY INCOME'),
                  _buildNavItem(
                    context,
                    icon: Icons.monetization_on_rounded,
                    title: 'Direct Income',
                    routeName: 'direct_income',
                    onTap: () => _navigate(
                      context,
                      DirectIncomeScreen(user: user),
                      'direct_income',
                    ),
                  ),
                  _buildNavItem(
                    context,
                    icon: Icons.layers_rounded,
                    title: 'Level Income',
                    routeName: 'level_income',
                    onTap: () => _navigate(
                      context,
                      LevelIncomeScreen(user: user),
                      'level_income',
                    ),
                  ),

                  _buildSectionHeader('FINANCE & REWARDS'),
                  _buildNavItem(
                    context,
                    icon: Icons.card_giftcard_rounded,
                    title: 'Rewards & Diamonds',
                    routeName: 'rewards',
                    onTap: () => _navigate(
                      context,
                      RewardsScreen(user: user),
                      'rewards',
                    ),
                  ),
                  _buildNavItem(
                    context,
                    icon: Icons.receipt_long_rounded,
                    title: 'Transactions & Payouts',
                    routeName: 'transactions',
                    onTap: () => _navigate(
                      context,
                      TransactionsScreen(user: user),
                      'transactions',
                    ),
                  ),

                  _buildSectionHeader('SYSTEM & SUPPORT'),
                  _buildNavItem(
                    context,
                    icon: Icons.settings_rounded,
                    title: 'Profile & Settings',
                    routeName: 'settings',
                    onTap: () => _navigate(
                      context,
                      SettingsScreen(user: user),
                      'settings',
                    ),
                  ),
                  _buildNavItem(
                    context,
                    icon: Icons.support_agent_rounded,
                    title: 'Support Tickets Desk',
                    routeName: 'support_tickets',
                    onTap: () => _navigate(
                      context,
                      SupportTicketsScreen(user: user),
                      'support_tickets',
                    ),
                  ),
                ],
              ),
            ),

            // Logout Footer
            const Divider(height: 1),
            ListTile(
              leading: const Icon(Icons.logout_rounded, color: AppColors.error),
              title: Text(
                'Logout',
                style: GoogleFonts.inter(
                  fontWeight: FontWeight.w700,
                  color: AppColors.error,
                  fontSize: 14,
                ),
              ),
              onTap: () => _handleLogout(context),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 18, top: 16, bottom: 6),
      child: Text(
        title,
        style: GoogleFonts.inter(
          fontSize: 10,
          fontWeight: FontWeight.w800,
          letterSpacing: 0.8,
          color: AppColors.textLight,
        ),
      ),
    );
  }

  Widget _buildNavItem(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String routeName,
    required VoidCallback onTap,
  }) {
    final isSelected = activeRoute == routeName;
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
      decoration: BoxDecoration(
        color: isSelected ? AppColors.primaryLight : Colors.transparent,
        borderRadius: BorderRadius.circular(10),
      ),
      child: ListTile(
        dense: true,
        leading: Icon(
          icon,
          color: isSelected ? AppColors.primary : AppColors.textMuted,
          size: 20,
        ),
        title: Text(
          title,
          style: GoogleFonts.inter(
            fontSize: 13,
            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
            color: isSelected ? AppColors.primary : AppColors.textHeading,
          ),
        ),
        trailing: isSelected
            ? Container(
                width: 6,
                height: 6,
                decoration: const BoxDecoration(
                  color: AppColors.primary,
                  shape: BoxShape.circle,
                ),
              )
            : null,
        onTap: onTap,
      ),
    );
  }
}
