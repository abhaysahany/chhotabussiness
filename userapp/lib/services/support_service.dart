import '../constants/api_constants.dart';
import 'api_client.dart';

class SupportService {
  static Future<List<dynamic>> getTickets({
    String? status,
    String? category,
    String? search,
  }) async {
    final params = <String, dynamic>{};
    if (status != null && status != 'All' && status != 'all') {
      params['status'] = status;
    }
    if (category != null && category != 'All' && category != 'all') {
      params['category'] = category;
    }
    if (search != null && search.trim().isNotEmpty) {
      params['search'] = search.trim();
    }

    final res = await ApiClient.get(ApiConstants.supportTickets, params: params);
    if (res is Map && res['tickets'] is List) {
      return res['tickets'] as List<dynamic>;
    }
    return [];
  }

  static Future<Map<String, dynamic>> createTicket({
    required String subject,
    required String category,
    String priority = 'Medium',
    required String description,
    String? customCategory,
  }) async {
    final body = {
      'subject': subject,
      'category': category,
      'priority': priority,
      'description': description,
      if (customCategory != null) 'custom_category': customCategory,
    };
    final res = await ApiClient.post(ApiConstants.supportTickets, body: body);
    return res is Map<String, dynamic> ? res : <String, dynamic>{};
  }

  static Future<Map<String, dynamic>> replyTicket(
    int ticketId, {
    required String message,
  }) async {
    final res = await ApiClient.post(
      '${ApiConstants.supportTickets}/$ticketId/reply',
      body: {'message': message},
    );
    return res is Map<String, dynamic> ? res : <String, dynamic>{};
  }

  static Future<Map<String, dynamic>> updateTicketStatus(
    int ticketId,
    String status,
  ) async {
    final res = await ApiClient.post(
      '${ApiConstants.supportTickets}/$ticketId/status',
      body: {'status': status},
    );
    return res is Map<String, dynamic> ? res : <String, dynamic>{};
  }
}
