import 'dart:io' show Platform;
import 'package:flutter/foundation.dart';

class ApiConstants {
  // Automatically detects platform: Android emulator vs Web / Desktop / Device
  static String get baseUrl {
    if (kIsWeb) {
      return 'http://localhost:8000/api';
    } else {
      try {
        if (Platform.isAndroid) {
          // 10.0.2.2 maps to host machine 127.0.0.1 on Android Emulator
          return 'http://10.0.2.2:8000/api';
        }
      } catch (_) {}
      return 'http://127.0.0.1:8000/api';
    }
  }

  // Endpoints
  static const String status = '/status';
  static const String login = '/login';
  static const String register = '/register';
  static const String verifySponsor = '/verify-sponsor';
  static const String sendOtp = '/send-otp';
  static const String verifyOtp = '/verify-otp';
  static const String forgotPassword = '/forgot-password';
  static const String verifyResetOtp = '/verify-reset-otp';
  static const String resetPassword = '/reset-password';
  static const String me = '/me';
  static const String logout = '/logout';
  static const String dashboardStats = '/user/dashboard-stats';
  static const String userInfo = '/user/info';

  // Network Endpoints
  static const String networkDirect = '/user/network/direct';
  static const String networkTeam = '/user/network/team';
  static const String networkGenealogy = '/user/network/genealogy';

  // Income Endpoints
  static const String incomeDirect = '/user/income/direct';
  static const String incomeDirectOrders = '/user/income/direct-orders';
  static const String incomeLevels = '/user/income/levels';
  static const String incomeSummary = '/user/income/summary';

  // Rewards Endpoints
  static const String rewards = '/user/rewards';
  static const String rewardClaims = '/user/reward-claims';
  static const String claimReward = '/user/rewards/claim';
  static const String diamonds = '/user/diamonds';

  // Payouts & Payments
  static const String payouts = '/user/payouts';
  static const String payoutWithdraw = '/user/payouts/withdraw';
  static const String businessReports = '/user/business-reports';

  // Settings, KYC & Bank Accounts
  static const String profile = '/user/profile';
  static const String profilePhoto = '/user/profile/photo';
  static const String updatePassword = '/user/update-password';
  static const String kycSubmit = '/user/kyc/submit';
  static const String payoutAccounts = '/user/payout-accounts';
  static const String sendBankOtp = '/user/send-bank-otp';
  static const String addBankAccount = '/user/bank-accounts/add';
  static const String addUpiAccount = '/user/upi-accounts/add';

  // Support Endpoints
  static const String supportTickets = '/user/support-tickets';
}
