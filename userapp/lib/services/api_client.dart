import 'dart:convert';
import 'package:http/http.dart' as http;
import '../constants/api_constants.dart';
import 'storage_service.dart';

class ApiClient {
  static Future<Map<String, String>> _headers() async {
    final token = await StorageService.getToken();
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Client-Type': 'mobile-app',
      'X-Mobile-App': '1',
      'X-User-Activity': '1',
    };
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  static Uri _buildUri(String path, [Map<String, dynamic>? queryParams]) {
    final base = ApiConstants.baseUrl;
    final fullUrl = '$base$path';
    final uri = Uri.parse(fullUrl);
    if (queryParams != null && queryParams.isNotEmpty) {
      final cleanParams = <String, String>{};
      queryParams.forEach((key, value) {
        if (value != null) {
          cleanParams[key] = value.toString();
        }
      });
      return uri.replace(queryParameters: cleanParams);
    }
    return uri;
  }

  static Future<dynamic> get(String path, {Map<String, dynamic>? params}) async {
    final uri = _buildUri(path, params);
    final headers = await _headers();
    final response = await http.get(uri, headers: headers);
    return _processResponse(response);
  }

  static Future<dynamic> post(String path, {dynamic body}) async {
    final uri = _buildUri(path);
    final headers = await _headers();
    final response = await http.post(
      uri,
      headers: headers,
      body: body != null ? jsonEncode(body) : null,
    );
    return _processResponse(response);
  }

  static Future<dynamic> put(String path, {dynamic body}) async {
    final uri = _buildUri(path);
    final headers = await _headers();
    final response = await http.put(
      uri,
      headers: headers,
      body: body != null ? jsonEncode(body) : null,
    );
    return _processResponse(response);
  }

  static Future<dynamic> delete(String path, {dynamic body}) async {
    final uri = _buildUri(path);
    final headers = await _headers();
    final response = await http.delete(
      uri,
      headers: headers,
      body: body != null ? jsonEncode(body) : null,
    );
    return _processResponse(response);
  }

  static dynamic _processResponse(http.Response response) {
    dynamic data;
    try {
      data = jsonDecode(response.body);
    } catch (_) {
      data = {'message': response.body};
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return data;
    } else {
      final msg = (data is Map && data['message'] != null)
          ? data['message'].toString()
          : 'Request failed with status: ${response.statusCode}';
      throw Exception(msg);
    }
  }
}
