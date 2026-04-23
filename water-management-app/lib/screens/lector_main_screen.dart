import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'lector_dashboard.dart';
import 'debt_inquiry_screen.dart';
import 'customer_management_screen.dart';

class LectorMainScreen extends StatefulWidget {
  const LectorMainScreen({super.key});

  @override
  State<LectorMainScreen> createState() => _LectorMainScreenState();
}

class _LectorMainScreenState extends State<LectorMainScreen> {
  int _selectedIndex = 0;

  final List<Widget> _screens = [
    const LectorDashboard(),
    const DebtInquiryScreen(),
    const CustomerManagementScreen(),
  ];

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _selectedIndex,
        children: _screens,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.3),
              blurRadius: 20,
              offset: const Offset(0, -5),
            ),
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: _selectedIndex,
          onTap: _onItemTapped,
          backgroundColor: const Color(0xFF1E293B),
          selectedItemColor: Colors.blueAccent,
          unselectedItemColor: const Color(0xFF64748B),
          showUnselectedLabels: true,
          type: BottomNavigationBarType.fixed,
          items: const [
            BottomNavigationBarItem(
              icon: Icon(LucideIcons.home),
              label: 'Ruta',
            ),
            BottomNavigationBarItem(
              icon: Icon(LucideIcons.fileSearch),
              label: 'Deudas',
            ),
            BottomNavigationBarItem(
              icon: Icon(LucideIcons.users),
              label: 'Clientes',
            ),
          ],
        ),
      ),
    );
  }
}
