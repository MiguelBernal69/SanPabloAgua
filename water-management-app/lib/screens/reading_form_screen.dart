import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../models/customer_model.dart';
import '../models/reading_model.dart';
import '../services/api_service.dart';
import '../providers/auth_provider.dart';

class ReadingFormScreen extends StatefulWidget {
  final Customer customer;
  const ReadingFormScreen({super.key, required this.customer});

  @override
  State<ReadingFormScreen> createState() => _ReadingFormScreenState();
}

class _ReadingFormScreenState extends State<ReadingFormScreen> {
  final _readingController = TextEditingController();
  final _notesController = TextEditingController();
  Reading? _lastReading;
  bool _isLoading = true;
  bool _isSaving = false;
  double _calculatedConsumption = 0;

  @override
  void initState() {
    super.initState();
    _loadLastReading();
    _readingController.addListener(_updateConsumption);
  }

  Future<void> _loadLastReading() async {
    final token = Provider.of<AuthProvider>(context, listen: false).token;
    try {
      final reading = await ApiService.getLastReading(widget.customer.id, token!);
      setState(() {
        _lastReading = reading;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  void _updateConsumption() {
    final current = double.tryParse(_readingController.text) ?? 0;
    final previous = _lastReading?.currentReading ?? 0;
    setState(() {
      _calculatedConsumption = current - previous;
    });
  }

  void _submitReading() async {
    final current = double.tryParse(_readingController.text);
    if (current == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Ingrese una lectura válida')));
      return;
    }

    if (current < (_lastReading?.currentReading ?? 0)) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('La lectura actual no puede ser menor a la anterior')));
      return;
    }

    setState(() => _isSaving = true);
    final token = Provider.of<AuthProvider>(context, listen: false).token;
    final now = DateTime.now();

    try {
      await ApiService.createReading(
        token: token!,
        customerId: widget.customer.id,
        currentReading: current,
        month: now.month,
        year: now.year,
        notes: _notesController.text,
      );
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Lectura registrada con éxito'), backgroundColor: Colors.green),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
        setState(() => _isSaving = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text('Registrar Lectura', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : SingleChildScrollView(
            padding: const EdgeInsets.all(25),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // House Photo if exists
                if (widget.customer.housePhoto != null) ...[
                  Text(
                    'FACHADA DE LA CASA', 
                    style: GoogleFonts.outfit(color: Colors.blueAccent, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1.2)
                  ),
                  const SizedBox(height: 10),
                  Container(
                    width: double.infinity,
                    height: 220,
                    margin: const EdgeInsets.only(bottom: 25),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(25),
                      border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.5),
                          blurRadius: 15,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(25),
                      child: CachedNetworkImage(
                        imageUrl: 'http://192.168.100.4:4000${widget.customer.housePhoto}',
                        fit: BoxFit.cover,
                        placeholder: (context, url) => const Center(child: CircularProgressIndicator()),
                        errorWidget: (context, url, error) => const Icon(LucideIcons.image, color: Color(0xFF64748B)),
                      ),
                    ),
                  ),
                ],
                // Info Card
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.blueAccent.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.blueAccent.withValues(alpha: 0.2)),
                  ),
                  child: Row(
                    children: [
                      const Icon(LucideIcons.user, color: Colors.blueAccent),
                      const SizedBox(width: 15),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(widget.customer.userName ?? 'Sin nombre', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                            Text('Código: ${widget.customer.customerCode}', style: const TextStyle(color: Colors.blueAccent, fontSize: 12)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 30),

                // Last Reading Info
                Text('LECTURA ANTERIOR', style: GoogleFonts.outfit(color: const Color(0xFF64748B), fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1.2)),
                const SizedBox(height: 10),
                Text(
                  '${_lastReading?.currentReading.toStringAsFixed(1) ?? "0.0"} m³',
                  style: GoogleFonts.outfit(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 30),

                // New Reading Input
                Text('NUEVA LECTURA ACTUAL', style: GoogleFonts.outfit(color: Colors.blueAccent, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1.2)),
                const SizedBox(height: 10),
                TextField(
                  controller: _readingController,
                  keyboardType: TextInputType.number,
                  style: GoogleFonts.outfit(color: Colors.white, fontSize: 40, fontWeight: FontWeight.bold),
                  decoration: InputDecoration(
                    hintText: '000.0',
                    hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.1)),
                    border: InputBorder.none,
                    suffixText: 'm³',
                    suffixStyle: const TextStyle(color: Color(0xFF64748B), fontSize: 20),
                  ),
                  autofocus: true,
                ),
                const Divider(color: Colors.blueAccent, thickness: 2),
                
                if (_calculatedConsumption > 0) ...[
                  const SizedBox(height: 10),
                  Text(
                    'CONSUMO CALCULADO: ${_calculatedConsumption.toStringAsFixed(1)} m³',
                    style: const TextStyle(color: Colors.greenAccent, fontWeight: FontWeight.bold, fontSize: 12),
                  ),
                ],
                const SizedBox(height: 30),

                // Notes
                TextField(
                  controller: _notesController,
                  style: const TextStyle(color: Colors.white),
                  decoration: InputDecoration(
                    labelText: 'Notas / Observaciones',
                    labelStyle: const TextStyle(color: Color(0xFF64748B)),
                    enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1))),
                    focusedBorder: const UnderlineInputBorder(borderSide: BorderSide(color: Colors.blueAccent)),
                  ),
                ),
                const SizedBox(height: 50),

                // Submit Button
                SizedBox(
                  width: double.infinity,
                  height: 60,
                  child: ElevatedButton(
                    onPressed: _isSaving ? null : _submitReading,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blueAccent,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                    ),
                    child: _isSaving 
                      ? const CircularProgressIndicator(color: Colors.white)
                      : const Text('GUARDAR LECTURA', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white)),
                  ),
                ),
              ],
            ),
          ),
    );
  }
}
