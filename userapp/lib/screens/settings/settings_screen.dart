import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../constants/app_colors.dart';
import '../../services/profile_service.dart';
import '../../services/storage_service.dart';
import '../../widgets/app_drawer.dart';

class SettingsScreen extends StatefulWidget {
  final Map<String, dynamic> user;
  final int initialTabIndex;

  const SettingsScreen({
    super.key,
    required this.user,
    this.initialTabIndex = 0,
  });

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  late Map<String, dynamic> _currentUser;
  bool _isLoading = true;

  // Profile Form Controllers
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  final _cityController = TextEditingController();
  final _stateController = TextEditingController();
  final _zipController = TextEditingController();
  bool _savingProfile = false;

  // Password Form Controllers
  final _currPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _savingPassword = false;

  // KYC Form Controllers
  final _panController = TextEditingController();
  final _aadhaarController = TextEditingController();
  final _dobController = TextEditingController();
  String _kycStatus = 'pending';
  bool _savingKyc = false;

  // Bank & UPI Data
  List<dynamic> _bankAccounts = [];
  List<dynamic> _upiAccounts = [];
  bool _loadingAccounts = false;

  @override
  void initState() {
    super.initState();
    _currentUser = Map<String, dynamic>.from(widget.user);
    _tabController = TabController(
      length: 4,
      vsync: this,
      initialIndex: (widget.initialTabIndex >= 0 && widget.initialTabIndex < 4)
          ? widget.initialTabIndex
          : 0,
    );
    _initUserData();
    _fetchProfileAndAccounts();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _nameController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _cityController.dispose();
    _stateController.dispose();
    _zipController.dispose();
    _currPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    _panController.dispose();
    _aadhaarController.dispose();
    _dobController.dispose();
    super.dispose();
  }

  void _initUserData() {
    _nameController.text = _currentUser['name']?.toString() ?? '';
    _phoneController.text = _currentUser['phone']?.toString() ?? '';
    _addressController.text = _currentUser['address']?.toString() ?? '';
    _cityController.text = _currentUser['city']?.toString() ?? '';
    _stateController.text = _currentUser['state']?.toString() ?? '';
    _zipController.text = _currentUser['zip_code']?.toString() ?? _currentUser['zipCode']?.toString() ?? '';

    _panController.text = _currentUser['pan_number']?.toString() ?? '';
    _aadhaarController.text = _currentUser['aadhaar_number']?.toString() ?? '';
    _dobController.text = _currentUser['dob']?.toString() ?? '';
    _kycStatus = _currentUser['kyc_status']?.toString().toLowerCase() ?? 'pending';
  }

  Future<void> _fetchProfileAndAccounts() async {
    setState(() => _isLoading = true);
    try {
      final results = await Future.wait([
        ProfileService.getProfile(),
        ProfileService.getPayoutAccounts(),
      ]);

      if (mounted) {
        setState(() {
          final pRes = results[0];
          if (pRes['user'] != null && pRes['user'] is Map) {
            _currentUser = Map<String, dynamic>.from(pRes['user'] as Map);
            StorageService.saveUser(_currentUser);
            _initUserData();
          }

          final accRes = results[1];
          _bankAccounts = accRes['bank_accounts'] as List<dynamic>? ?? accRes['bankAccounts'] as List<dynamic>? ?? [];
          _upiAccounts = accRes['upi_accounts'] as List<dynamic>? ?? accRes['upiAccounts'] as List<dynamic>? ?? [];
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleSaveProfile() async {
    setState(() => _savingProfile = true);
    try {
      final res = await ProfileService.updateProfile({
        'name': _nameController.text.trim(),
        'phone': _phoneController.text.trim(),
        'address': _addressController.text.trim(),
        'city': _cityController.text.trim(),
        'state': _stateController.text.trim(),
        'zip_code': _zipController.text.trim(),
      });

      if (mounted) {
        if (res['user'] != null) {
          _currentUser = Map<String, dynamic>.from(res['user'] as Map);
          await StorageService.saveUser(_currentUser);
        }
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Personal profile updated successfully!'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceFirst('Exception: ', '')),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _savingProfile = false);
    }
  }

  Future<void> _handleUpdatePassword() async {
    if (_newPasswordController.text.length < 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('New password must be at least 6 characters')),
      );
      return;
    }
    if (_newPasswordController.text != _confirmPasswordController.text) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Passwords do not match')),
      );
      return;
    }

    setState(() => _savingPassword = true);
    try {
      await ProfileService.updatePassword(
        currentPassword: _currPasswordController.text,
        newPassword: _newPasswordController.text,
        confirmPassword: _confirmPasswordController.text,
      );

      if (mounted) {
        _currPasswordController.clear();
        _newPasswordController.clear();
        _confirmPasswordController.clear();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Password changed successfully!'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceFirst('Exception: ', '')),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _savingPassword = false);
    }
  }

  Future<void> _handleSubmitKyc() async {
    if (_panController.text.trim().isEmpty || _aadhaarController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('PAN and Aadhaar numbers are required')),
      );
      return;
    }

    setState(() => _savingKyc = true);
    try {
      final res = await ProfileService.submitKyc(
        panNumber: _panController.text.trim(),
        aadhaarNumber: _aadhaarController.text.trim(),
        dateOfBirth: _dobController.text.trim(),
        permanentAddress: _addressController.text.trim(),
      );

      if (mounted) {
        setState(() => _kycStatus = res['kyc_status']?.toString().toLowerCase() ?? 'verified');
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('KYC documents submitted for review!'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceFirst('Exception: ', '')),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _savingKyc = false);
    }
  }

  void _showAddBankDialog() {
    final holderController = TextEditingController();
    final bankNameController = TextEditingController();
    final accNoController = TextEditingController();
    final ifscController = TextEditingController();
    bool submitting = false;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Text(
            'Add Bank Account',
            style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 17),
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: holderController,
                  decoration: const InputDecoration(labelText: 'Account Holder Name *', border: OutlineInputBorder(), isDense: true),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: bankNameController,
                  decoration: const InputDecoration(labelText: 'Bank Name *', border: OutlineInputBorder(), isDense: true),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: accNoController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Account Number *', border: OutlineInputBorder(), isDense: true),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: ifscController,
                  textCapitalization: TextCapitalization.characters,
                  decoration: const InputDecoration(labelText: 'IFSC Code *', border: OutlineInputBorder(), isDense: true),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: submitting
                  ? null
                  : () async {
                      if (holderController.text.isEmpty || accNoController.text.isEmpty || ifscController.text.isEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Please fill all required fields')),
                        );
                        return;
                      }
                      setDialogState(() => submitting = true);
                      try {
                        await ProfileService.addBankAccount({
                          'account_holder_name': holderController.text.trim(),
                          'bank_name': bankNameController.text.trim(),
                          'account_number': accNoController.text.trim(),
                          'ifsc_code': ifscController.text.trim().toUpperCase(),
                        });
                        if (ctx.mounted) Navigator.pop(ctx);
                        _fetchProfileAndAccounts();
                      } catch (e) {
                        setDialogState(() => submitting = false);
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text(e.toString().replaceFirst('Exception: ', '')), backgroundColor: AppColors.error),
                          );
                        }
                      }
                    },
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white),
              child: submitting
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text('Save Bank Account'),
            ),
          ],
        ),
      ),
    );
  }

  void _showAddUpiDialog() {
    final upiIdController = TextEditingController();
    final holderController = TextEditingController();
    bool submitting = false;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Text(
            'Add UPI Payout ID',
            style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 17),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: upiIdController,
                decoration: const InputDecoration(
                  labelText: 'UPI ID (e.g. mobile@upi) *',
                  border: OutlineInputBorder(),
                  isDense: true,
                ),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: holderController,
                decoration: const InputDecoration(
                  labelText: 'Account Holder / Display Name',
                  border: OutlineInputBorder(),
                  isDense: true,
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: submitting
                  ? null
                  : () async {
                      if (upiIdController.text.trim().isEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Please enter valid UPI ID')),
                        );
                        return;
                      }
                      setDialogState(() => submitting = true);
                      try {
                        await ProfileService.addUpiAccount({
                          'upi_id': upiIdController.text.trim(),
                          'account_holder_name': holderController.text.trim(),
                        });
                        if (ctx.mounted) Navigator.pop(ctx);
                        _fetchProfileAndAccounts();
                      } catch (e) {
                        setDialogState(() => submitting = false);
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text(e.toString().replaceFirst('Exception: ', '')), backgroundColor: AppColors.error),
                          );
                        }
                      }
                    },
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white),
              child: submitting
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text('Save UPI ID'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: const BackButton(),
        title: Text(
          'Settings & Account Management',
          style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 17),
        ),
      ),
      body: NestedScrollView(
        headerSliverBuilder: (context, innerBoxIsScrolled) => [
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.cardBorder),
                ),
                child: TabBar(
                  controller: _tabController,
                  isScrollable: true,
                  tabAlignment: TabAlignment.start,
                  indicatorColor: AppColors.primary,
                  labelColor: AppColors.primary,
                  unselectedLabelColor: AppColors.textMuted,
                  labelStyle: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 13),
                  tabs: const [
                    Tab(text: 'Personal Profile'),
                    Tab(text: 'Security & Password'),
                    Tab(text: 'KYC Verification'),
                    Tab(text: 'Bank & UPI Accounts'),
                  ],
                ),
              ),
            ),
          ),
        ],
        body: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : TabBarView(
                controller: _tabController,
                children: [
                  _buildProfileTab(),
                  _buildSecurityTab(),
                  _buildKycTab(),
                  _buildBankAccountsTab(),
                ],
              ),
      ),
    );
  }

  // 1. Personal Profile Tab
  Widget _buildProfileTab() {
    final email = _currentUser['email']?.toString() ?? '';
    final userCode = _currentUser['user_code']?.toString() ?? _currentUser['userCode']?.toString() ?? '';

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.cardBorder),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 28,
                  backgroundColor: AppColors.primary,
                  child: Text(
                    _nameController.text.isNotEmpty ? _nameController.text[0].toUpperCase() : 'P',
                    style: GoogleFonts.poppins(fontSize: 22, color: Colors.white, fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _nameController.text,
                        style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w700),
                      ),
                      Text('Sponsor ID: $userCode', style: GoogleFonts.inter(fontSize: 11, color: AppColors.primary, fontWeight: FontWeight.w600)),
                      Text(email, style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            const Divider(height: 1),
            const SizedBox(height: 16),
            _buildTextField('Full Legal Name', _nameController, Icons.person_outline),
            _buildTextField('Phone Number', _phoneController, Icons.phone_outlined, keyboardType: TextInputType.phone),
            _buildTextField('Street Address', _addressController, Icons.home_outlined),
            Row(
              children: [
                Expanded(child: _buildTextField('City', _cityController, Icons.location_city_outlined)),
                const SizedBox(width: 10),
                Expanded(child: _buildTextField('State', _stateController, Icons.map_outlined)),
              ],
            ),
            _buildTextField('Postal / Pin Code', _zipController, Icons.pin_drop_outlined, keyboardType: TextInputType.number),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _savingProfile ? null : _handleSaveProfile,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                child: _savingProfile
                    ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : Text('Update Profile Details', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // 2. Security Tab
  Widget _buildSecurityTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Container(
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
              'Change Account Password',
              style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textHeading),
            ),
            Text(
              'Ensure your password has at least 6 characters with mixed symbols & numbers for security.',
              style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted),
            ),
            const SizedBox(height: 18),
            _buildTextField('Current Password', _currPasswordController, Icons.lock_outline, obscureText: true),
            _buildTextField('New Password', _newPasswordController, Icons.lock_reset, obscureText: true),
            _buildTextField('Confirm New Password', _confirmPasswordController, Icons.check_circle_outline, obscureText: true),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _savingPassword ? null : _handleUpdatePassword,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                child: _savingPassword
                    ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : Text('Update Password', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // 3. KYC Tab
  Widget _buildKycTab() {
    final isVerified = _kycStatus == 'verified' || _kycStatus == 'approved';

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.cardBorder),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Statutory KYC Compliance',
                  style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textHeading),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: isVerified ? AppColors.successLight : AppColors.warningLight,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    _kycStatus.toUpperCase(),
                    style: GoogleFonts.inter(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: isVerified ? AppColors.success : AppColors.warning,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              'Government approved PAN & Aadhaar UID are required for TDS deductions & commission withdrawals.',
              style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted),
            ),
            const SizedBox(height: 18),
            _buildTextField(
              'PAN Card Number *',
              _panController,
              Icons.badge_outlined,
              capitalization: TextCapitalization.characters,
              enabled: !isVerified,
            ),
            _buildTextField(
              'Aadhaar UID Number (12 Digits) *',
              _aadhaarController,
              Icons.fingerprint_rounded,
              keyboardType: TextInputType.number,
              enabled: !isVerified,
            ),
            _buildTextField(
              'Date of Birth (YYYY-MM-DD)',
              _dobController,
              Icons.calendar_today_outlined,
              enabled: !isVerified,
            ),
            const SizedBox(height: 16),
            if (!isVerified)
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _savingKyc ? null : _handleSubmitKyc,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  child: _savingKyc
                      ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : Text('Submit KYC for Verification', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
                ),
              )
            else
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.successLight,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.verified_rounded, color: AppColors.success, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Your KYC is fully verified. You are eligible for unrestricted commission withdrawals.',
                        style: GoogleFonts.inter(fontSize: 11, color: AppColors.success, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  // 4. Bank & UPI Accounts Tab
  Widget _buildBankAccountsTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Bank Accounts Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Bank Accounts',
                style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textHeading),
              ),
              TextButton.icon(
                onPressed: _showAddBankDialog,
                icon: const Icon(Icons.add, size: 16),
                label: const Text('Add Bank'),
                style: TextButton.styleFrom(foregroundColor: AppColors.primary),
              ),
            ],
          ),
          if (_bankAccounts.isEmpty)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.cardBorder),
              ),
              child: Text('No bank accounts saved.', style: GoogleFonts.inter(color: AppColors.textMuted, fontSize: 12)),
            )
          else
            ..._bankAccounts.map((b) {
              final bankMap = b is Map<String, dynamic> ? b : Map<String, dynamic>.from(b as Map);
              final id = bankMap['id'];
              final bank = bankMap['bank_name'] ?? 'Bank';
              final acc = bankMap['account_number'] ?? '—';
              final isPrimary = bankMap['is_primary'] == true || bankMap['is_primary'] == 1;

              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: isPrimary ? AppColors.primary : AppColors.cardBorder),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.account_balance_rounded, color: AppColors.primary, size: 24),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(bank, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700)),
                              if (isPrimary) ...[
                                const SizedBox(width: 6),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                                  decoration: BoxDecoration(color: AppColors.primaryLight, borderRadius: BorderRadius.circular(4)),
                                  child: Text('PRIMARY', style: GoogleFonts.inter(fontSize: 8, fontWeight: FontWeight.w800, color: AppColors.primary)),
                                ),
                              ],
                            ],
                          ),
                          Text('A/C: $acc', style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted)),
                        ],
                      ),
                    ),
                    if (!isPrimary && id != null)
                      TextButton(
                        onPressed: () async {
                          await ProfileService.setPrimaryBankAccount(id is int ? id : int.parse(id.toString()));
                          _fetchProfileAndAccounts();
                        },
                        child: const Text('Make Primary', style: TextStyle(fontSize: 11)),
                      ),
                  ],
                ),
              );
            }),
          const SizedBox(height: 18),

          // UPI Accounts Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'UPI IDs',
                style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textHeading),
              ),
              TextButton.icon(
                onPressed: _showAddUpiDialog,
                icon: const Icon(Icons.add, size: 16),
                label: const Text('Add UPI'),
                style: TextButton.styleFrom(foregroundColor: AppColors.primary),
              ),
            ],
          ),
          if (_upiAccounts.isEmpty)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.cardBorder),
              ),
              child: Text('No UPI IDs registered.', style: GoogleFonts.inter(color: AppColors.textMuted, fontSize: 12)),
            )
          else
            ..._upiAccounts.map((u) {
              final upiMap = u is Map<String, dynamic> ? u : Map<String, dynamic>.from(u as Map);
              final id = upiMap['id'];
              final upiId = upiMap['upi_id'] ?? '—';
              final isPrimary = upiMap['is_primary'] == true || upiMap['is_primary'] == 1;

              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: isPrimary ? AppColors.secondary : AppColors.cardBorder),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.qr_code_2_rounded, color: AppColors.secondary, size: 24),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(upiId, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700)),
                              if (isPrimary) ...[
                                const SizedBox(width: 6),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                                  decoration: BoxDecoration(color: AppColors.secondaryLight, borderRadius: BorderRadius.circular(4)),
                                  child: Text('PRIMARY', style: GoogleFonts.inter(fontSize: 8, fontWeight: FontWeight.w800, color: AppColors.secondary)),
                                ),
                              ],
                            ],
                          ),
                        ],
                      ),
                    ),
                    if (!isPrimary && id != null)
                      TextButton(
                        onPressed: () async {
                          await ProfileService.setPrimaryUpiAccount(id is int ? id : int.parse(id.toString()));
                          _fetchProfileAndAccounts();
                        },
                        child: const Text('Make Primary', style: TextStyle(fontSize: 11)),
                      ),
                  ],
                ),
              );
            }),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildTextField(
    String label,
    TextEditingController controller,
    IconData icon, {
    bool obscureText = false,
    bool enabled = true,
    TextInputType keyboardType = TextInputType.text,
    TextCapitalization capitalization = TextCapitalization.none,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: controller,
        obscureText: obscureText,
        enabled: enabled,
        keyboardType: keyboardType,
        textCapitalization: capitalization,
        decoration: InputDecoration(
          labelText: label,
          labelStyle: GoogleFonts.inter(fontSize: 12, color: AppColors.textMuted),
          prefixIcon: Icon(icon, size: 18, color: AppColors.primary),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
          isDense: true,
        ),
      ),
    );
  }
}
