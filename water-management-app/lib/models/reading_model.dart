class Reading {
  final String id;
  final String customerId;
  final double previousReading;
  final double currentReading;
  final double consumption;
  final double totalAmount;
  final bool isPaid;
  final DateTime readingDate;
  final int month;
  final int year;

  Reading({
    required this.id,
    required this.customerId,
    required this.previousReading,
    required this.currentReading,
    required this.consumption,
    required this.totalAmount,
    required this.isPaid,
    required this.readingDate,
    required this.month,
    required this.year,
  });

  factory Reading.fromJson(Map<String, dynamic> json) {
    return Reading(
      id: json['id'],
      customerId: json['customer_id'],
      previousReading: (json['previous_reading'] as num).toDouble(),
      currentReading: (json['current_reading'] as num).toDouble(),
      consumption: (json['consumption'] as num).toDouble(),
      totalAmount: (json['total_amount'] as num).toDouble(),
      isPaid: json['is_paid'] ?? false,
      readingDate: DateTime.parse(json['reading_date']),
      month: json['month'],
      year: json['year'],
    );
  }
}
