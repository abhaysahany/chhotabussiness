import '../constants/api_constants.dart';
import 'api_client.dart';

class RewardService {
  static Future<List<dynamic>> getRewards() async {
    final res = await ApiClient.get(ApiConstants.rewards);
    if (res is Map && res['rewards'] is List) {
      return res['rewards'] as List<dynamic>;
    }
    return [];
  }

  static Future<List<dynamic>> getRewardClaims({String? userCode}) async {
    final params = <String, dynamic>{};
    if (userCode != null && userCode.isNotEmpty) {
      params['user_code'] = userCode;
    }
    final res = await ApiClient.get(ApiConstants.rewardClaims, params: params);
    if (res is Map && res['claims'] is List) {
      return res['claims'] as List<dynamic>;
    }
    return [];
  }

  static Future<Map<String, dynamic>> claimReward({
    required int rewardId,
    String? shippingAddress,
    String? phone,
    String? notes,
  }) async {
    final body = {
      'reward_id': rewardId,
      if (shippingAddress != null) 'shipping_address': shippingAddress,
      if (phone != null) 'phone': phone,
      if (notes != null) 'notes': notes,
    };
    final res = await ApiClient.post(ApiConstants.claimReward, body: body);
    return res is Map<String, dynamic> ? res : <String, dynamic>{};
  }

  static Future<Map<String, dynamic>> getDiamonds() async {
    final res = await ApiClient.get(ApiConstants.diamonds);
    return res is Map<String, dynamic> ? res : <String, dynamic>{};
  }
}
