import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../constants/app_colors.dart';
import '../../services/reward_service.dart';
import '../../widgets/app_drawer.dart';

class RewardsScreen extends StatefulWidget {
  final Map<String, dynamic> user;

  const RewardsScreen({super.key, required this.user});

  @override
  State<RewardsScreen> createState() => _RewardsScreenState();
}

class _RewardsScreenState extends State<RewardsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isLoading = true;
  String? _error;

  List<dynamic> _rewards = [];
  List<dynamic> _claims = [];
  Map<String, dynamic> _diamondWallet = {
    'diamond_balance': 0,
    'level_1_diamonds': 0,
    'level_2_diamonds': 0,
    'conversion_rate_inr': 100,
  };

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
        RewardService.getRewards(),
        RewardService.getRewardClaims(userCode: userCode),
        RewardService.getDiamonds(),
      ]);

      if (mounted) {
        setState(() {
          _rewards = results[0] as List<dynamic>;
          _claims = results[1] as List<dynamic>;
          final diamondData = results[2] as Map<String, dynamic>;
          if (diamondData['wallet'] is Map) {
            _diamondWallet = Map<String, dynamic>.from(diamondData['wallet'] as Map);
          }
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

  void _showClaimDialog(Map<String, dynamic> reward) {
    final rewardId = int.tryParse(reward['id']?.toString() ?? '0') ?? 0;
    final title = reward['title']?.toString() ?? reward['name']?.toString() ?? 'Reward Item';
    final diamondCost = double.tryParse(reward['required_diamonds']?.toString() ?? reward['diamonds']?.toString() ?? '0') ?? 0;
    final currentDiamonds = double.tryParse(_diamondWallet['diamond_balance']?.toString() ?? '0') ?? 0;

    final addressController = TextEditingController();
    final phoneController = TextEditingController(text: widget.user['phone']?.toString() ?? '');
    final notesController = TextEditingController();
    bool submitting = false;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) {
          final canAfford = currentDiamonds >= diamondCost;

          return AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            title: Text(
              'Claim Milestone Reward',
              style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 17),
            ),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.primary),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      const Icon(Icons.diamond_rounded, size: 16, color: Color(0xFF0284C7)),
                      const SizedBox(width: 4),
                      Text(
                        'Required: $diamondCost Diamonds',
                        style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textHeading),
                      ),
                    ],
                  ),
                  Text(
                    'Available in wallet: $currentDiamonds Diamonds',
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      color: canAfford ? AppColors.success : AppColors.error,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 16),
                  if (!canAfford)
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AppColors.errorLight,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        'Insufficient diamonds. Continue referring and earning milestone diamonds to unlock this reward.',
                        style: GoogleFonts.inter(fontSize: 11, color: AppColors.error),
                      ),
                    )
                  else ...[
                    TextField(
                      controller: addressController,
                      maxLines: 2,
                      decoration: InputDecoration(
                        labelText: 'Shipping Delivery Address *',
                        labelStyle: GoogleFonts.inter(fontSize: 12),
                        border: const OutlineInputBorder(),
                        isDense: true,
                      ),
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: phoneController,
                      keyboardType: TextInputType.phone,
                      decoration: InputDecoration(
                        labelText: 'Contact Phone Number *',
                        labelStyle: GoogleFonts.inter(fontSize: 12),
                        border: const OutlineInputBorder(),
                        isDense: true,
                      ),
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: notesController,
                      decoration: InputDecoration(
                        labelText: 'Additional Notes / Size / Color',
                        labelStyle: GoogleFonts.inter(fontSize: 12),
                        border: const OutlineInputBorder(),
                        isDense: true,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: Text('Cancel', style: GoogleFonts.inter(color: AppColors.textMuted)),
              ),
              if (canAfford)
                ElevatedButton(
                  onPressed: submitting
                      ? null
                      : () async {
                          if (addressController.text.trim().isEmpty) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Please enter your shipping address')),
                            );
                            return;
                          }
                          setDialogState(() => submitting = true);
                          try {
                            await RewardService.claimReward(
                              rewardId: rewardId,
                              shippingAddress: addressController.text.trim(),
                              phone: phoneController.text.trim(),
                              notes: notesController.text.trim(),
                            );
                            if (ctx.mounted) Navigator.pop(ctx);
                            if (mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Reward claim submitted successfully!'),
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
                      ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Text('Confirm Claim'),
                ),
            ],
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final diamondBal = _diamondWallet['diamond_balance']?.toString() ?? '0';
    final l1Diamonds = _diamondWallet['level_1_diamonds']?.toString() ?? '0';
    final l2Diamonds = _diamondWallet['level_2_diamonds']?.toString() ?? '0';

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: const BackButton(),
        title: Text(
          'Rewards & Diamond Wallet',
          style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 17),
        ),
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
                    // Diamond Wallet Card
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF0F4C81), Color(0xFF1E3A8A)],
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
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  const Icon(Icons.diamond_rounded, color: Color(0xFF38BDF8), size: 28),
                                  const SizedBox(width: 8),
                                  Text(
                                    'Diamond Balance',
                                    style: GoogleFonts.poppins(
                                      fontSize: 15,
                                      fontWeight: FontWeight.w700,
                                      color: Colors.white,
                                    ),
                                  ),
                                ],
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.18),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  '1 💎 = ₹100',
                                  style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: Colors.white),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Text(
                            '$diamondBal 💎',
                            style: GoogleFonts.poppins(
                              fontSize: 26,
                              fontWeight: FontWeight.w800,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(height: 10),
                          const Divider(color: Colors.white24, height: 1),
                          const SizedBox(height: 10),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'L1 Diamonds: $l1Diamonds',
                                style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFFCBD5E1)),
                              ),
                              Text(
                                'L2 Diamonds: $l2Diamonds',
                                style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFFCBD5E1)),
                              ),
                            ],
                          ),
                        ],
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
                          Tab(text: 'Available Rewards (${_rewards.length})'),
                          Tab(text: 'Claimed History (${_claims.length})'),
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
                    _buildAvailableTab(),
                    _buildClaimedTab(),
                  ],
                ),
        ),
      ),
    );
  }

  Widget _buildAvailableTab() {
    if (_rewards.isEmpty) {
      return Center(
        child: Text('No rewards catalog found.', style: GoogleFonts.inter(color: AppColors.textMuted)),
      );
    }

    final double currentDiamonds = double.tryParse(_diamondWallet['diamond_balance']?.toString() ?? '0') ?? 0;

    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      itemCount: _rewards.length,
      itemBuilder: (ctx, idx) {
        final r = _rewards[idx] is Map<String, dynamic> ? _rewards[idx] : Map<String, dynamic>.from(_rewards[idx] as Map);
        final title = r['title']?.toString() ?? r['name']?.toString() ?? 'Milestone Gift';
        final description = r['description']?.toString() ?? 'Unlock through diamond milestones';
        final requiredDiamonds = double.tryParse(r['required_diamonds']?.toString() ?? r['diamonds']?.toString() ?? '0') ?? 0;
        final cashValue = r['cash_value']?.toString() ?? r['inr_value']?.toString() ?? '';
        final progress = requiredDiamonds > 0 ? (currentDiamonds / requiredDiamonds).clamp(0.0, 1.0) : 1.0;
        final isUnlocked = currentDiamonds >= requiredDiamonds;

        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: isUnlocked ? AppColors.successBorder : AppColors.cardBorder),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.02),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: isUnlocked ? AppColors.successLight : AppColors.primaryLight,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      Icons.card_giftcard_rounded,
                      color: isUnlocked ? AppColors.success : AppColors.primary,
                      size: 26,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          style: GoogleFonts.poppins(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textHeading,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          description,
                          style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.diamond_rounded, size: 16, color: Color(0xFF0284C7)),
                      const SizedBox(width: 4),
                      Text(
                        '$requiredDiamonds 💎',
                        style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textHeading),
                      ),
                    ],
                  ),
                  if (cashValue.isNotEmpty)
                    Text(
                      'Value: ₹$cashValue',
                      style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.secondary),
                    ),
                ],
              ),
              const SizedBox(height: 8),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: progress,
                  minHeight: 6,
                  backgroundColor: const Color(0xFFE2E8F0),
                  color: isUnlocked ? AppColors.success : AppColors.primary,
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => _showClaimDialog(r),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: isUnlocked ? AppColors.success : AppColors.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  child: Text(
                    isUnlocked ? 'Claim Reward Now' : 'Check Milestone Requirements',
                    style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 12),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildClaimedTab() {
    if (_claims.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.history_rounded, size: 48, color: AppColors.textLight),
            const SizedBox(height: 10),
            Text(
              'No rewards claimed yet.',
              style: GoogleFonts.poppins(fontWeight: FontWeight.w600, color: AppColors.textHeading),
            ),
            Text(
              'Reach milestone diamond targets to claim gifts.',
              style: GoogleFonts.inter(fontSize: 12, color: AppColors.textMuted),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      itemCount: _claims.length,
      itemBuilder: (ctx, idx) {
        final c = _claims[idx] is Map<String, dynamic> ? _claims[idx] : Map<String, dynamic>.from(_claims[idx] as Map);
        final title = c['reward_title'] ?? c['reward']?['title'] ?? 'Claimed Reward';
        final status = c['status']?.toString().toLowerCase() ?? 'pending';
        final date = c['created_at']?.toString().split('T').first ?? '—';
        final tracking = c['tracking_number']?.toString() ?? '';

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
                decoration: const BoxDecoration(
                  color: AppColors.primaryLight,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.inventory_2_rounded, color: AppColors.primary, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textHeading),
                    ),
                    Text('Claim Date: $date', style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted)),
                    if (tracking.isNotEmpty)
                      Text('Tracking: $tracking', style: GoogleFonts.inter(fontSize: 11, color: AppColors.primary)),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: status == 'delivered' || status == 'approved' ? AppColors.successLight : AppColors.warningLight,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  status.toUpperCase(),
                  style: GoogleFonts.inter(
                    fontSize: 9,
                    fontWeight: FontWeight.w700,
                    color: status == 'delivered' || status == 'approved' ? AppColors.success : AppColors.warning,
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
