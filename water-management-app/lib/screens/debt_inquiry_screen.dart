import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../providers/auth_provider.dart';
import '../models/customer_model.dart';
import '../models/reading_model.dart';
import '../services/api_service.dart';

class DebtInquiryScreen extends StatefulWidget {
  const DebtInquiryScreen({super.key});

  @override
  State<DebtInquiryScreen> createState() => _DebtInquiryScreenState();
}

class _DebtInquiryScreenState extends State<DebtInquiryScreen> {
  List<Customer> _customers = [];
  List<Customer> _filteredCustomers = [];
  bool _isLoading = true;
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadCustomers();
    _searchController.addListener(_filterCustomers);
  }

  Future<void> _loadCustomers() async {
    final token = Provider.of<AuthProvider>(context, listen: false).token;
    try {
      final customers = await ApiService.getCustomers(token!);
      setState(() {
        _customers = customers;
        _filteredCustomers = customers;
        _isLoading = false;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error al cargar clientes: $e')));
        setState(() => _isLoading = false);
      }
    }
  }

  void _filterCustomers() {
    final query = _searchController.text.toLowerCase();
    setState(() {
      _filteredCustomers = _customers.where((c) {
        return (c.userName?.toLowerCase().contains(query) ?? false) ||
            c.customerCode.toLowerCase().contains(query);
      }).toList();
    });
  }

  Future<void> _showDebtDetails(Customer customer) async {
    final token = Provider.of<AuthProvider>(context, listen: false).token;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) =>
          _DebtDetailsSheet(customer: customer, token: token!),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text(
          'Consulta de Deudas',
          style: GoogleFonts.outfit(
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: Column(
        children: [
          // Search Bar
          Padding(
            padding: const EdgeInsets.all(20),
            child: Container(
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(15),
                border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
              ),
              child: TextField(
                controller: _searchController,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  hintText: 'Buscar por nombre o código...',
                  hintStyle: TextStyle(color: Color(0xFF64748B)),
                  prefixIcon: Icon(
                    LucideIcons.search,
                    color: Colors.blueAccent,
                  ),
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.symmetric(vertical: 15),
                ),
              ),
            ),
          ),

          // List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _filteredCustomers.isEmpty
                ? const Center(
                    child: Text(
                      'No se encontraron clientes',
                      style: TextStyle(color: Color(0xFF64748B)),
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    itemCount: _filteredCustomers.length,
                    itemBuilder: (context, index) {
                      final customer = _filteredCustomers[index];
                      return Container(
                        margin: const EdgeInsets.only(bottom: 15),
                        decoration: BoxDecoration(
                          color: const Color(0xFF1E293B),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: Colors.white.withValues(alpha: 0.05),
                          ),
                        ),
                        child: ListTile(
                          contentPadding: const EdgeInsets.all(15),
                          leading: Container(
                            width: 50,
                            height: 50,
                            decoration: BoxDecoration(
                              color: Colors.orangeAccent.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Icon(
                              LucideIcons.user,
                              color: Colors.orangeAccent,
                            ),
                          ),
                          title: Text(
                            customer.userName ?? 'Sin nombre',
                            style: GoogleFonts.outfit(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                          subtitle: Text(
                            'Cód: ${customer.customerCode}',
                            style: const TextStyle(
                              color: Color(0xFF94A3B8),
                              fontSize: 13,
                            ),
                          ),
                          trailing: const Icon(
                            LucideIcons.chevronRight,
                            color: Color(0xFF64748B),
                          ),
                          onTap: () => _showDebtDetails(customer),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }
}

class _DebtDetailsSheet extends StatefulWidget {
  final Customer customer;
  final String token;

  const _DebtDetailsSheet({required this.customer, required this.token});

  @override
  State<_DebtDetailsSheet> createState() => _DebtDetailsSheetState();
}

class _DebtDetailsSheetState extends State<_DebtDetailsSheet> {
  bool _isLoading = true;
  List<Reading> _unpaidReadings = [];
  double _totalDebt = 0;
  String _errorMessage = '';

  @override
  void initState() {
    super.initState();
    _fetchDebt();
  }

  Future<void> _fetchDebt() async {
    try {
      final readings = await ApiService.getCustomerReadings(
        widget.customer.id,
        widget.token,
      );

      final unpaid = readings.where((r) => !r.isPaid).toList();
      double total = 0;
      for (var r in unpaid) {
        total += r.totalAmount;
      }

      setState(() {
        _unpaidReadings = unpaid;
        _totalDebt = total;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
      });
    }
  }

  String _getMonthName(int month) {
    const months = [
      '',
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];
    if (month >= 1 && month <= 12) return months[month];
    return month.toString();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.7,
      decoration: const BoxDecoration(
        color: Color(0xFF0F172A),
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(30),
          topRight: Radius.circular(30),
        ),
      ),
      child: Column(
        children: [
          // Drag handle
          Container(
            margin: const EdgeInsets.only(top: 15, bottom: 20),
            width: 50,
            height: 5,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(10),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.redAccent.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(15),
                  ),
                  child: Icon(
                    LucideIcons.alertTriangle,
                    color: Colors.redAccent,
                  ),
                ),
                const SizedBox(width: 15),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Detalle de Deuda',
                        style: GoogleFonts.outfit(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      Text(
                        widget.customer.userName ?? 'Cliente',
                        style: const TextStyle(color: Color(0xFF94A3B8)),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),
          const Divider(color: Color(0xFF1E293B), thickness: 2),

          // Content
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _errorMessage.isNotEmpty
                ? Center(
                    child: Text(
                      _errorMessage,
                      style: const TextStyle(color: Colors.redAccent),
                    ),
                  )
                : _unpaidReadings.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          LucideIcons.checkCircle,
                          color: Colors.greenAccent,
                          size: 60,
                        ),
                        const SizedBox(height: 15),
                        Text(
                          'Sin deudas pendientes',
                          style: GoogleFonts.outfit(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(20),
                    itemCount: _unpaidReadings.length,
                    itemBuilder: (context, index) {
                      final reading = _unpaidReadings[index];
                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(15),
                        decoration: BoxDecoration(
                          color: const Color(0xFF1E293B),
                          borderRadius: BorderRadius.circular(15),
                          border: Border.all(
                            color: Colors.white.withValues(alpha: 0.05),
                          ),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '${_getMonthName(reading.month)} ${reading.year}',
                                  style: GoogleFonts.outfit(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16,
                                  ),
                                ),
                                Text(
                                  'Consumo: ${reading.consumption} m³',
                                  style: const TextStyle(
                                    color: Color(0xFF94A3B8),
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ),
                            Text(
                              'Bs. ${reading.totalAmount.toStringAsFixed(2)}',
                              style: GoogleFonts.outfit(
                                color: Colors.redAccent,
                                fontWeight: FontWeight.bold,
                                fontSize: 18,
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
          ),

          // Total Footer
          if (!_isLoading && _unpaidReadings.isNotEmpty)
            Container(
              padding: const EdgeInsets.all(25),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(30),
                  topRight: Radius.circular(30),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.2),
                    blurRadius: 10,
                    offset: const Offset(0, -5),
                  ),
                ],
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Deuda Total:',
                    style: GoogleFonts.outfit(
                      color: Colors.white,
                      fontSize: 18,
                    ),
                  ),
                  Text(
                    'Bs. ${_totalDebt.toStringAsFixed(2)}',
                    style: GoogleFonts.outfit(
                      color: Colors.redAccent,
                      fontWeight: FontWeight.bold,
                      fontSize: 24,
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
