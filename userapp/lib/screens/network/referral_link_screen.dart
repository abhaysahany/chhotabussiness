import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../constants/app_colors.dart';
import '../../services/network_service.dart';
import '../../widgets/app_drawer.dart';

class ReferralLinkScreen extends StatefulWidget {
  final Map<String, dynamic> user;

  const ReferralLinkScreen({super.key, required this.user});

  @override
  State<ReferralLinkScreen> createState() => _ReferralLinkScreenState();
}

class _ReferralLinkScreenState extends State<ReferralLinkScreen> {
  bool _isLoading = true;
  int _directCount = 0;
  int _activeDirectCount = 0;
  int _totalTeamCount = 0;

  @override
  void initState() {
    super.initState();
    _fetchStats();
  }

  Future<void> _fetchStats() async {
    try {
      final userCode = widget.user['user_code']?.toString() ?? widget.user['userCode']?.toString() ?? 'CB100001';
      final results = await Future.wait([
        NetworkService.getDirectConnections(userCode: userCode),
        NetworkService.getTeamConnections(userCode: userCode),
      ]);

      final directRes = results[0];
      final teamRes = results[1];

      if (mounted) {
        setState(() {
          _directCount = directRes['stats']?['totalDirectCount'] ?? 0;
          _activeDirectCount = directRes['stats']?['activeCount'] ?? 0;
          _totalTeamCount = teamRes['summary']?['totalTeamCount'] ?? 0;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _copyToClipboard(String text, String label) {
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$label copied to clipboard!'),
        backgroundColor: AppColors.primary,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final userCode = widget.user['user_code']?.toString() ?? widget.user['userCode']?.toString() ?? 'CB100001';
    final referralUrl = 'https://vyaparadnet.com/register?ref=$userCode';

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: const BackButton(),
        title: Text(
          'Referral Link & Promoter Tools',
          style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 17),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Referral Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF0F4C81), Color(0xFF0A355C)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
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
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.share_rounded, color: Colors.white, size: 24),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Your Sponsor ID',
                              style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFFCBD5E1)),
                            ),
                            Text(
                              userCode,
                              style: GoogleFonts.poppins(
                                fontSize: 20,
                                fontWeight: FontWeight.w800,
                                color: Colors.white,
                              ),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.copy_rounded, color: Colors.white),
                        tooltip: 'Copy Sponsor ID',
                        onPressed: () => _copyToClipboard(userCode, 'Sponsor ID'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),
                  Text(
                    'Direct Registration Link:',
                    style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFFCBD5E1)),
                  ),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            referralUrl,
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              color: Colors.white,
                              fontWeight: FontWeight.w500,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 8),
                        GestureDetector(
                          onTap: () => _copyToClipboard(referralUrl, 'Referral link'),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            decoration: BoxDecoration(
                              color: AppColors.secondary,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              'COPY',
                              style: GoogleFonts.inter(
                                fontSize: 11,
                                fontWeight: FontWeight.w800,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),

            // Promoter Performance Metrics
            Text(
              'Promoter Attribution Stats',
              style: GoogleFonts.poppins(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppColors.textHeading,
              ),
            ),
            const SizedBox(height: 10),

            if (_isLoading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(24),
                  child: CircularProgressIndicator(),
                ),
              )
            else
              Row(
                children: [
                  Expanded(
                    child: _buildStatBox(
                      'Direct Partners',
                      '$_directCount',
                      Icons.person_add_alt_1_rounded,
                      AppColors.primary,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _buildStatBox(
                      'Active Direct',
                      '$_activeDirectCount',
                      Icons.verified_rounded,
                      AppColors.success,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _buildStatBox(
                      'Total Team',
                      '$_totalTeamCount',
                      Icons.hub_rounded,
                      AppColors.secondary,
                    ),
                  ),
                ],
              ),
            const SizedBox(height: 20),

            // Share Templates
            Text(
              'Quick Share Templates',
              style: GoogleFonts.poppins(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppColors.textHeading,
              ),
            ),
            const SizedBox(height: 10),

            _buildShareTemplate(
              title: 'Standard Partner Invitation',
              description:
                  'Join Vyapar Adnet Partner Network! Register with my Sponsor ID $userCode and start earning multi-level commissions: $referralUrl',
            ),
            const SizedBox(height: 10),
            _buildShareTemplate(
              title: 'Business Growth Invitation',
              description:
                  'Grow your business reach with Vyapar Adnet. Join our executive network using sponsor code $userCode at $referralUrl',
            ),
            const SizedBox(height: 20),

            // How it works steps
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.cardBorder),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'How Referral Attribution Works',
                    style: GoogleFonts.poppins(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textHeading,
                    ),
                  ),
                  const SizedBox(height: 12),
                  _buildStepRow('1', 'Share your referral link or Sponsor ID ($userCode).'),
                  _buildStepRow('2', 'Candidate signs up and verifies mobile / email with OTP.'),
                  _buildStepRow('3', 'They become permanently linked under your Level 1 direct team in MySQL.'),
                  _buildStepRow('4', 'You earn Level 1 Direct Income and 10-level commissions automatically.'),
                ],
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildStatBox(String title, String value, IconData icon, Color color) {
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
          Icon(icon, size: 18, color: color),
          const SizedBox(height: 6),
          Text(
            value,
            style: GoogleFonts.poppins(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: AppColors.textHeading,
            ),
          ),
          Text(
            title,
            style: GoogleFonts.inter(fontSize: 10, color: AppColors.textMuted),
          ),
        ],
      ),
    );
  }

  Widget _buildShareTemplate({required String title, required String description}) {
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
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textHeading,
                ),
              ),
              InkWell(
                onTap: () => _copyToClipboard(description, title),
                child: Row(
                  children: [
                    const Icon(Icons.copy_rounded, size: 14, color: AppColors.primary),
                    const SizedBox(width: 4),
                    Text(
                      'Copy Text',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: AppColors.primary,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            description,
            style: GoogleFonts.inter(
              fontSize: 12,
              color: AppColors.textMuted,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStepRow(String step, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 22,
            height: 22,
            decoration: const BoxDecoration(
              color: AppColors.primaryLight,
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                step,
                style: GoogleFonts.inter(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  color: AppColors.primary,
                ),
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              text,
              style: GoogleFonts.inter(
                fontSize: 12,
                color: AppColors.textHeading,
                height: 1.35,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
