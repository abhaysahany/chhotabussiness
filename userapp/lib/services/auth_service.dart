import 'dart:convert';
import 'package:http/http.dart' as http;
import '../constants/api_constants.dart';
import 'storage_service.dart';

class AuthService {
  static Map<String, String> _headers([String? token]) {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  // 1. User Login
  static Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    final url = Uri.parse('${ApiConstants.baseUrl}${ApiConstants.login}');
    try {
      final response = await http.post(
        url,
        headers: _headers(),
        body: jsonEncode({
          'email': email.trim(),
          'password': password,
        }),
      );

      final data = jsonDecode(response.body) as Map<String, dynamic>;
      if (response.statusCode >= 200 && response.statusCode < 300) {
        if (data['token'] != null) {
          await StorageService.saveToken(data['token'].toString());
        }
        if (data['user'] != null) {
          await StorageService.saveUser(data['user'] as Map<String, dynamic>);
        }
        return data;
      } else {
        throw Exception(data['message'] ?? 'Invalid email or password.');
      }
    } catch (e) {
      if (e is FormatException) {
        throw Exception('Server returned an unexpected response. Please verify backend is running.');
      }
      rethrow;
    }
  }

  // 2. Verify Sponsor ID (Real-time debounced)
  static Future<Map<String, dynamic>> verifySponsor(String sponsorId) async {
    final url = Uri.parse('${ApiConstants.baseUrl}${ApiConstants.verifySponsor}');
    final response = await http.post(
      url,
      headers: _headers(),
      body: jsonEncode({
        'sponsor_id': sponsorId.trim(),
      }),
    );

    final data = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return data;
    } else {
      throw Exception(data['message'] ?? 'Invalid Sponsor ID. Sponsor does not exist.');
    }
  }

  // 3. Send Registration Email OTP
  static Future<Map<String, dynamic>> sendRegistrationOtp(String email) async {
    final url = Uri.parse('${ApiConstants.baseUrl}${ApiConstants.sendOtp}');
    final response = await http.post(
      url,
      headers: _headers(),
      body: jsonEncode({
        'email': email.trim(),
      }),
    );

    final data = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return data;
    } else {
      throw Exception(data['message'] ?? 'Failed to send OTP to email.');
    }
  }

  // 4. Complete Member Registration
  static Future<Map<String, dynamic>> register({
    required String name,
    required String email,
    required String password,
    required String sponsorId,
    required String otp,
    required bool termsAccepted,
  }) async {
    final url = Uri.parse('${ApiConstants.baseUrl}${ApiConstants.register}');
    final response = await http.post(
      url,
      headers: _headers(),
      body: jsonEncode({
        'name': name.trim(),
        'email': email.trim(),
        'password': password,
        'sponsor_id': sponsorId.trim(),
        'otp': otp.trim(),
        'terms_accepted': termsAccepted,
      }),
    );

    final data = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (data['token'] != null) {
        await StorageService.saveToken(data['token'].toString());
      }
      if (data['user'] != null) {
        await StorageService.saveUser(data['user'] as Map<String, dynamic>);
      }
      return data;
    } else {
      throw Exception(data['message'] ?? 'Registration failed.');
    }
  }

  // 5. Send Forgot Password OTP
  static Future<Map<String, dynamic>> sendForgotPasswordOtp(String email) async {
    final url = Uri.parse('${ApiConstants.baseUrl}${ApiConstants.forgotPassword}');
    final response = await http.post(
      url,
      headers: _headers(),
      body: jsonEncode({
        'email': email.trim(),
      }),
    );

    final data = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return data;
    } else {
      throw Exception(data['message'] ?? 'Account not found with that email.');
    }
  }

  // 6. Verify Forgot Password OTP
  static Future<Map<String, dynamic>> verifyResetOtp({
    required String email,
    required String otp,
  }) async {
    final url = Uri.parse('${ApiConstants.baseUrl}${ApiConstants.verifyResetOtp}');
    final response = await http.post(
      url,
      headers: _headers(),
      body: jsonEncode({
        'email': email.trim(),
        'otp': otp.trim(),
      }),
    );

    final data = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return data;
    } else {
      throw Exception(data['message'] ?? 'Invalid or expired OTP code.');
    }
  }

  // 7. Reset User Password
  static Future<Map<String, dynamic>> resetPassword({
    required String email,
    required String otp,
    required String newPassword,
  }) async {
    final url = Uri.parse('${ApiConstants.baseUrl}${ApiConstants.resetPassword}');
    final response = await http.post(
      url,
      headers: _headers(),
      body: jsonEncode({
        'email': email.trim(),
        'otp': otp.trim(),
        'password': newPassword,
      }),
    );

    final data = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return data;
    } else {
      throw Exception(data['message'] ?? 'Failed to reset password.');
    }
  }

  // 8. Get Current Authenticated User Profile
  static Future<Map<String, dynamic>?> getCurrentUser() async {
    final token = await StorageService.getToken();
    if (token == null) return null;

    final url = Uri.parse('${ApiConstants.baseUrl}${ApiConstants.me}');
    final response = await http.get(url, headers: _headers(token));

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      if (data['user'] != null) {
        await StorageService.saveUser(data['user'] as Map<String, dynamic>);
      }
      return data['user'] as Map<String, dynamic>?;
    }
    return null;
  }

  // 9. Fetch Live SaaS Dashboard Stats from Database
  static Future<Map<String, dynamic>?> getDashboardStats() async {
    final token = await StorageService.getToken();
    final url = Uri.parse('${ApiConstants.baseUrl}${ApiConstants.dashboardStats}');
    final response = await http.get(url, headers: _headers(token));

    if (response.statusCode == 200) {
      return jsonDecode(response.body) as Map<String, dynamic>;
    }
    return null;
  }

  // 10. Logout
  static Future<void> logout() async {
    try {
      final token = await StorageService.getToken();
      if (token != null) {
        final url = Uri.parse('${ApiConstants.baseUrl}${ApiConstants.logout}');
        await http.post(url, headers: _headers(token));
      }
    } catch (_) {}
    await StorageService.clearAuth();
  }
}
