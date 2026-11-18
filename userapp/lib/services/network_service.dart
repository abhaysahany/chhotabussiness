import '../constants/api_constants.dart';
import 'api_client.dart';

class NetworkService {
  static Future<Map<String, dynamic>> getDirectConnections({String? userCode}) async {
    final params = <String, dynamic>{};
    if (userCode != null && userCode.isNotEmpty) {
      params['user_code'] = userCode;
    }
    final res = await ApiClient.get(ApiConstants.networkDirect, params: params);
    return res is Map<String, dynamic> ? res : <String, dynamic>{};
  }

  static Future<Map<String, dynamic>> getTeamConnections({String? userCode}) async {
    final params = <String, dynamic>{};
    if (userCode != null && userCode.isNotEmpty) {
      params['user_code'] = userCode;
    }
    final res = await ApiClient.get(ApiConstants.networkTeam, params: params);
    return res is Map<String, dynamic> ? res : <String, dynamic>{};
  }

  static Future<Map<String, dynamic>> getGenealogyTree({String? userCode, int depth = 10}) async {
    final params = <String, dynamic>{'depth': depth};
    if (userCode != null && userCode.isNotEmpty) {
      params['user_code'] = userCode;
    }
    final res = await ApiClient.get(ApiConstants.networkGenealogy, params: params);
    return res is Map<String, dynamic> ? res : <String, dynamic>{};
  }
}
