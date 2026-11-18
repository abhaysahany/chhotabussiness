import '../constants/api_constants.dart';
import 'api_client.dart';

class ProfileService {
  static Future<Map<String, dynamic>> getProfile() async {
    final res = await ApiClient.get(ApiConstants.profile);
    return res is Map<String, dynamic> ? res : <String, dynamic>{};
  }

  static Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> data) async {
    final res = await ApiClient.post(ApiConstants.profile, body: data);
    return res is Map<String, dynamic> ? res : <String, dynamic>{};
  }

  static Future<Map<String, dynamic>> updatePassword({
    required String currentPassword,
    required String newPassword,
    required String confirmPassword,
  }) async {
    final body = {
      'current_password': currentPassword,
      'password': newPassword,
      'password_confirmation': confirmPassword,
    };
    final res = await ApiClient.post(ApiConstants.updatePassword, body: body);
    return res is Map<String, dynamic> ? res : <String, dynamic>{};
  }

  static Future<Map<String, dynamic>> submitKyc({
    required String panNumber,
    required String aadhaarNumber,
    String? dateOfBirth,
    String? permanentAddress,
  }) async {
    final body = {
      'pan_number': panNumber,
      'aadhaar_number': aadhaarNumber,
      if (dateOfBirth != null) 'dob': dateOfBirth,
      if (permanentAddress != null) 'address': permanentAddress,
    };
    final res = await ApiClient.post(ApiConstants.kycSubmit, body: body);
    return res is Map<String, dynamic> ? res : <String, dynamic>{};
  }

  static Future<Map<String, dynamic>> getPayoutAccounts() async {
    final res = await ApiClient.get(ApiConstants.payoutAccounts);
    return res is Map<String, dynamic> ? res : <String, dynamic>{};
  }

  static Future<Map<String, dynamic>> sendBankOtp({required String purpose}) async {
    final res = await ApiClient.post(ApiConstants.sendBankOtp, body: {'purpose': purpose});
    return res is Map<String, dynamic> ? res : <String, dynamic>{};
  }

  static Future<Map<String, dynamic>> addBankAccount(Map<String, dynamic> data) async {
    final res = await ApiClient.post(ApiConstants.addBankAccount, body: data);
    return res is Map<String, dynamic> ? res : <String, dynamic>{};
  }

  static Future<Map<String, dynamic>> deleteBankAccount(int id, [String? otp]) async {
    final body = otp != null ? {'otp': otp} : null;
    final res = await ApiClient.post('/user/bank-accounts/$id/delete', body: body);
    return res is Map<String, dynamic> ? res : <String, dynamic>{};
  }

  static Future<Map<String, dynamic>> setPrimaryBankAccount(int id) async {
    final res = await ApiClient.post('/user/bank-accounts/$id/primary');
    return res is Map<String, dynamic> ? res : <String, dynamic>{};
  }

  static Future<Map<String, dynamic>> addUpiAccount(Map<String, dynamic> data) async {
    final res = await ApiClient.post(ApiConstants.addUpiAccount, body: data);
    return res is Map<String, dynamic> ? res : <String, dynamic>{};
  }

  static Future<Map<String, dynamic>> deleteUpiAccount(int id, [String? otp]) async {
    final body = otp != null ? {'otp': otp} : null;
    final res = await ApiClient.post('/user/upi-accounts/$id/delete', body: body);
    return res is Map<String, dynamic> ? res : <String, dynamic>{};
  }

  static Future<Map<String, dynamic>> setPrimaryUpiAccount(int id) async {
    final res = await ApiClient.post('/user/upi-accounts/$id/primary');
    return res is Map<String, dynamic> ? res : <String, dynamic>{};
  }
}
