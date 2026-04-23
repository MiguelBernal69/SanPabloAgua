class Customer {
  final String id;
  final String userId;
  final String customerCode;
  final String address;
  final double? latitude;
  final double? longitude;
  final String? userName;
  final String? housePhoto;
  final bool isReadThisMonth;

  Customer({
    required this.id,
    required this.userId,
    required this.customerCode,
    required this.address,
    this.latitude,
    this.longitude,
    this.userName,
    this.housePhoto,
    this.isReadThisMonth = false,
  });

  factory Customer.fromJson(Map<String, dynamic> json) {
    // Si hay lecturas en el JSON, significa que ya fue leído este mes
    // debido al filtro que aplicamos en el Backend.
    final List? readings = json['readings'];
    final bool read = readings != null && readings.isNotEmpty;

    return Customer(
      id: json['id'],
      userId: json['user_id'],
      customerCode: json['customer_code'],
      address: json['address'],
      latitude: json['latitude']?.toDouble(),
      longitude: json['longitude']?.toDouble(),
      userName: json['user']?['name'],
      housePhoto: json['house_photo'],
      isReadThisMonth: read,
    );
  }
}
