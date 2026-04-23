class User {
  final String id;
  final String name;
  final String phone;
  final String role;
  final bool isActive;
  final String? token;

  User({
    required this.id,
    required this.name,
    required this.phone,
    required this.role,
    required this.isActive,
    this.token,
  });

  factory User.fromJson(Map<String, dynamic> json, {String? token}) {
    return User(
      id: json['id'],
      name: json['name'],
      phone: json['phone'],
      role: json['role'],
      isActive: json['is_active'] ?? true,
      token: token,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'phone': phone,
      'role': role,
      'is_active': isActive,
    };
  }
}
