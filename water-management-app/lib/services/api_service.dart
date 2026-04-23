import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import '../models/user_model.dart';
import '../models/customer_model.dart';
import '../models/reading_model.dart';

class ApiService {
  // Cambia esto a tu IP local si pruebas en un dispositivo físico
  // Para emulador Android usa http://10.0.2.2:8080
  static const String baseUrl = 'http://192.168.100.4:4000/api/v1';

  static Future<Map<String, dynamic>> login(
    String phone,
    String password,
  ) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'phone': phone, 'password': password}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {
          'user': User.fromJson(data['user'], token: data['token']),
          'token': data['token'],
        };
      } else {
        throw Exception(jsonDecode(response.body)['error'] ?? 'Error de login');
      }
    } catch (e) {
      rethrow;
    }
  }

  static Future<List<Customer>> getCustomers(String token) async {
    final response = await http.get(
      Uri.parse('$baseUrl/customers'),
      headers: {'Authorization': 'Bearer $token'},
    );

    if (response.statusCode == 200) {
      List data = jsonDecode(response.body);
      return data.map((item) => Customer.fromJson(item)).toList();
    } else {
      throw Exception('Error al obtener clientes');
    }
  }

  static Future<Reading?> getLastReading(
    String customerId,
    String token,
  ) async {
    final response = await http.get(
      Uri.parse('$baseUrl/readings/customer/$customerId'),
      headers: {'Authorization': 'Bearer $token'},
    );

    if (response.statusCode == 200) {
      List data = jsonDecode(response.body);
      if (data.isNotEmpty) {
        return Reading.fromJson(data[0]);
      }
    }
    return null;
  }

  static Future<List<Reading>> getCustomerReadings(
    String customerId,
    String token,
  ) async {
    final response = await http.get(
      Uri.parse('$baseUrl/readings/customer/$customerId'),
      headers: {'Authorization': 'Bearer $token'},
    );

    if (response.statusCode == 200) {
      List data = jsonDecode(response.body);
      return data.map((item) => Reading.fromJson(item)).toList();
    } else {
      throw Exception('Error al obtener el historial de lecturas');
    }
  }

  static Future<void> createReading({
    required String token,
    required String customerId,
    required double currentReading,
    required int month,
    required int year,
    String notes = '',
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/readings'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'customer_id': customerId,
        'current_reading': currentReading,
        'month': month,
        'year': year,
        'notes': notes,
      }),
    );

    if (response.statusCode != 201) {
      throw Exception(
        jsonDecode(response.body)['error'] ?? 'Error al registrar lectura',
      );
    }
  }

  // Actualizar datos técnicos (Ubicación)
  static Future<void> updateCustomerTechnicalData(
      String customerId, double lat, double lng, String token) async {
    final response = await http.put(
      Uri.parse('$baseUrl/customers/$customerId'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'latitude': lat,
        'longitude': lng,
      }),
    );

    if (response.statusCode != 200) {
      throw Exception('Error al actualizar ubicación: ${response.body}');
    }
  }

  // Subir foto de la casa
  static Future<String> uploadCustomerPhoto(
      String customerId, File photoFile, String token) async {
    var request = http.MultipartRequest(
      'POST',
      Uri.parse('$baseUrl/customers/$customerId/photo'),
    );

    request.headers['Authorization'] = 'Bearer $token';

    var stream = http.ByteStream(photoFile.openRead());
    var length = await photoFile.length();

    var multipartFile = http.MultipartFile(
      'photo',
      stream,
      length,
      filename: 'photo.jpg',
      contentType: MediaType('image', 'jpeg'),
    );

    request.files.add(multipartFile);

    var response = await request.send();
    var responseBody = await response.stream.bytesToString();

    if (response.statusCode == 200) {
      final data = json.decode(responseBody);
      return data['url'];
    } else {
      throw Exception('Error al subir foto: $responseBody');
    }
  }
}
