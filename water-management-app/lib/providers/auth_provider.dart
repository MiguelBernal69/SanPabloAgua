import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';

class AuthProvider with ChangeNotifier {
  User? _user;
  String? _token;
  bool _isLoading = false;

  User? get user => _user;
  String? get token => _token;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _token != null;

  Future<void> login(String phone, String password) async {
    _isLoading = true;
    notifyListeners();

    try {
      final result = await ApiService.login(phone, password);
      final user = result['user'] as User;
      
      // Solo permitir el acceso a Lectores o Administradores
      if (user.role != 'lector' && user.role != 'admin') {
        throw Exception('Esta aplicación es exclusiva para el personal de lectura. Por favor usa el portal web.');
      }

      _user = user;
      _token = result['token'];
      
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('token', _token!);
      await prefs.setString('phone', phone);
      
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  Future<void> logout() async {
    _user = null;
    _token = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    notifyListeners();
  }

  Future<void> tryAutoLogin() async {
    final prefs = await SharedPreferences.getInstance();
    if (!prefs.containsKey('token')) return;
    
    // Aquí podríamos validar el token contra el servidor si tuviéramos un endpoint /me
    _token = prefs.getString('token');
    // Como simplificación por ahora, no cargamos el perfil completo aquí
    notifyListeners();
  }
}
