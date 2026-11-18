import '../constants/api_constants.dart';
import 'api_client.dart';

class PayoutService {
  static Future<Map<String, dynamic>> getPayouts({
    String? userCode,
    String? status,
    String? datePreset,
    String? startDate,
    String? endDate,
  }) async {
    final params = <String, dynamic>{};
    if (userCode != null && userCode.isNotEmpty) params['user_code'] = userCode;
    if (status != null && status != 'all' && status != 'All') params['status'] = status;
    if (datePreset != null && datePreset != 'all') params['date_preset'] = datePreset;
    if (startDate != null && startDate.isNotEmpty) params['start_date'] = startDate;
    if (endDate != null && endDate.isNotEmpty) params['end_date'] = endDate;

    final res = await ApiClient.get(ApiConstants.payouts, params: params);
    return res is Map<String, dynamic> ? res : <String, dynamic>{};
  }

  static Future<Map<String, dynamic>> requestWithdrawal({
    required double amount,
    String? payoutMethod,
    int? accountId,
  }) async {
    final body = {
      'amount': amount,
      if (payoutMethod != null) 'payout_method': payoutMethod,
      if (accountId != null) 'account_id': accountId,
    };
    final res = await ApiClient.post(ApiConstants.payoutWithdraw, body: body);
    return res is Map<String, dynamic> ? res : <String, dynamic>{};
  }

  static Future<Map<String, dynamic>> getBusinessReports({String? userCode}) async {
    final params = <String, dynamic>{};
    if (userCode != null && userCode.isNotEmpty) {
      params['user_code'] = userCode;
    }
    final res = await ApiClient.get(ApiConstants.businessReports, params: params);
    return res is Map<String, dynamic> ? res : <String, dynamic>{};
  }
}
