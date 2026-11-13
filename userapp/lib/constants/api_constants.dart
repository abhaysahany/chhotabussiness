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
}
