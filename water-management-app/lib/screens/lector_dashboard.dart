import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../providers/auth_provider.dart';
import '../models/customer_model.dart';
import '../services/api_service.dart';
import 'reading_form_screen.dart';
import 'debt_inquiry_screen.dart';

class LectorDashboard extends StatefulWidget {
  const LectorDashboard({super.key});

  @override
  State<LectorDashboard> createState() => _LectorDashboardState();
}

class _LectorDashboardState extends State<LectorDashboard> {
  List<Customer> _customers = [];
  List<Customer> _filteredCustomers = [];
  bool _isLoading = true;
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadData();
    _searchController.addListener(_filterCustomers);
  }

  Future<void> _loadData() async {
    final token = Provider.of<AuthProvider>(context, listen: false).token;
    try {
      final customers = await ApiService.getCustomers(token!);
      
      // Ordenar: primero alfabéticamente por código, luego mover los leídos al final
      customers.sort((a, b) => a.customerCode.compareTo(b.customerCode));
      
      final notRead = customers.where((c) => !c.isReadThisMonth).toList();
      final alreadyRead = customers.where((c) => c.isReadThisMonth).toList();
      
      final sortedList = [...notRead, ...alreadyRead];

      setState(() {
        _customers = sortedList;
        _filteredCustomers = sortedList;
        _isLoading = false;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error al cargar datos: $e')),
        );
      }
    }
  }

  void _filterCustomers() {
    final query = _searchController.text.toLowerCase();
    setState(() {
      _filteredCustomers = _customers.where((c) {
        return c.customerCode.toLowerCase().contains(query) ||
               (c.userName?.toLowerCase().contains(query) ?? false);
      }).toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text(
          'Ruta de Lectura',
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white),
        ),
        actions: [
          IconButton(
            icon: Icon(LucideIcons.search, color: Colors.orangeAccent),
            tooltip: 'Consultar Deudas',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const DebtInquiryScreen()),
              );
            },
          ),
          IconButton(
            icon: const Icon(LucideIcons.logOut, color: Colors.redAccent),
            onPressed: () => Provider.of<AuthProvider>(context, listen: false).logout(),
          ),
        ],
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
                  hintText: 'Buscar por código o nombre...',
                  hintStyle: TextStyle(color: Color(0xFF64748B)),
                  prefixIcon: Icon(LucideIcons.search, color: Colors.blueAccent),
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
                : RefreshIndicator(
                    onRefresh: _loadData,
                    child: ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      itemCount: _filteredCustomers.length,
                      itemBuilder: (context, index) {
                        final customer = _filteredCustomers[index];
                        return _buildCustomerCard(customer);
                      },
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildCustomerCard(Customer customer) {
    return Container(
      margin: const EdgeInsets.only(bottom: 15),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.all(15),
        leading: Container(
          width: 55,
          height: 55,
          decoration: BoxDecoration(
            color: customer.isReadThisMonth 
                ? Colors.greenAccent.withValues(alpha: 0.05)
                : Colors.blueAccent.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(15),
            border: Border.all(
              color: customer.isReadThisMonth ? Colors.transparent : Colors.blueAccent.withValues(alpha: 0.2)
            ),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(15),
            child: customer.housePhoto != null
                ? CachedNetworkImage(
                    imageUrl: 'http://192.168.100.4:4000${customer.housePhoto}',
                    fit: BoxFit.cover,
                    placeholder: (context, url) => const Center(child: CircularProgressIndicator(strokeWidth: 2)),
                    errorWidget: (context, url, error) => Icon(
                      customer.isReadThisMonth ? LucideIcons.checkCircle : LucideIcons.home, 
                      color: customer.isReadThisMonth ? Colors.greenAccent.withValues(alpha: 0.3) : Colors.blueAccent
                    ),
                  )
                : Icon(
                    customer.isReadThisMonth ? LucideIcons.checkCircle : LucideIcons.home, 
                    color: customer.isReadThisMonth ? Colors.greenAccent.withValues(alpha: 0.3) : Colors.blueAccent
                  ),
          ),
        ),
        title: Text(
          customer.userName ?? 'Sin nombre',
          style: GoogleFonts.outfit(
            color: customer.isReadThisMonth ? Colors.white.withValues(alpha: 0.4) : Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 16,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 5),
            Text(
              'Cód: ${customer.customerCode}',
              style: TextStyle(
                color: customer.isReadThisMonth ? Colors.blueAccent.withValues(alpha: 0.3) : Colors.blueAccent, 
                fontWeight: FontWeight.bold
              ),
            ),
            Text(
              customer.address,
              style: TextStyle(
                color: customer.isReadThisMonth ? const Color(0xFF94A3B8).withValues(alpha: 0.4) : const Color(0xFF94A3B8), 
                fontSize: 12
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              customer.isReadThisMonth ? LucideIcons.checkCircle : LucideIcons.chevronRight, 
              color: customer.isReadThisMonth ? Colors.greenAccent : const Color(0xFF64748B)
            ),
            if (customer.isReadThisMonth)
              const Text('EDITAR', style: TextStyle(color: Colors.greenAccent, fontSize: 8, fontWeight: FontWeight.bold)),
          ],
        ),
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => ReadingFormScreen(customer: customer),
            ),
          ).then((_) => _loadData());
        },
      ),
    );
  }
}
