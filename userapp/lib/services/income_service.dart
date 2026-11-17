import '../constants/api_constants.dart';
import 'api_client.dart';

class IncomeService {
  static Future<Map<String, dynamic>> getDirectIncome() async {
    final res = await ApiClient.get(ApiConstants.incomeDirect);
    return res is Map<String, dynamic> ? res : <String, dynamic>{};
  }

  static Future<Map<String, dynamic>> getDirectIncomeOrders({
    int page = 1,
    int perPage = 10,
    String? status,
    String? search,
    String sortBy = 'last_distribution_at',
    String sortOrder = 'desc',
  }) async {
    final params = <String, dynamic>{
      'page': page,
      'per_page': perPage,
      'sort_by': sortBy,
      'sort_order': sortOrder,
    };
    if (status != null && status != 'all') {
      params['status'] = status;
    }
    if (search != null && search.trim().isNotEmpty) {
      params['search'] = search.trim();
    }

    final res = await ApiClient.get(ApiConstants.incomeDirectOrders, params: params);
    return res is Map<String, dynamic> ? res : <String, dynamic>{};
  }

  static Future<Map<String, dynamic>> getLevelIncome() async {
    final res = await ApiClient.get(ApiConstants.incomeLevels);
    return res is Map<String, dynamic> ? res : <String, dynamic>{};
  }

  static Future<Map<String, dynamic>> getIncomeSummary() async {
    final res = await ApiClient.get(ApiConstants.incomeSummary);
    return res is Map<String, dynamic> ? res : <String, dynamic>{};
  }
}
