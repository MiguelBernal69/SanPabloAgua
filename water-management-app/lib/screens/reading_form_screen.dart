import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../models/customer_model.dart';
import '../models/reading_model.dart';
import '../services/api_service.dart';
import '../providers/auth_provider.dart';
import '../services/print_service.dart';


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
  bool _isSaved = false;
  String _printStatus = "";
  double _calculatedConsumption = 0;
  
  // Detalle de cobro
  double _baseCost = 37.0;
  double _excess1Cost = 0;
  double _excess2Cost = 0;
  double _totalCost = 37.0;
  
  bool _isEditMode = false;
  String? _existingReadingId;
  Reading? _actualPreviousReading; // Nueva variable para guardar la lectura real del mes pasado

  @override
  void initState() {
    super.initState();
    _loadLastReading();
    _readingController.addListener(_updateConsumption);
  }

  Future<void> _loadLastReading() async {
    final token = Provider.of<AuthProvider>(context, listen: false).token;
    final now = DateTime.now();
    try {
      // 1. Obtener el historial de lecturas (vienen ordenadas por fecha desc)
      final readings = await ApiService.getCustomerReadings(widget.customer.id, token!);
      
      if (readings.isNotEmpty) {
        final newest = readings.first;
        bool isSameMonth = newest.month == now.month && newest.year == now.year;

        setState(() {
          if (isSameMonth) {
            _isEditMode = true;
            _existingReadingId = newest.id;
            _readingController.text = newest.currentReading.toString();
            _notesController.text = newest.notes ?? "";
            
            // La lectura anterior real es la SEGUNDA de la lista
            _actualPreviousReading = readings.length > 1 ? readings[1] : null;
          } else {
            _isEditMode = false;
            _actualPreviousReading = newest;
          }
          _isLoading = false;
        });
      } else {
        setState(() {
          _isEditMode = false;
          _actualPreviousReading = null;
          _isLoading = false;
        });
      }
      _updateConsumption();
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  void _updateConsumption() {
    final current = double.tryParse(_readingController.text) ?? 0;
    
    final previous = _actualPreviousReading?.currentReading ?? 0;
    final consumption = current - previous;
    
    // Lógica de Cobro San Pablo
    double base = 37.0;
    double ex1 = 0;
    double ex2 = 0;
    
    if (consumption > 10) {
      double excessMts = consumption - 10;
      if (excessMts <= 15) { // Hasta 25 m3 total (10+15)
        ex1 = excessMts * 3.0;
      } else {
        ex1 = 15 * 3.0; // Los primeros 15 excedentes
        ex2 = (excessMts - 15) * 8.0; // El resto a 8 Bs
      }
    }

    setState(() {
      _calculatedConsumption = consumption;
      _baseCost = base;
      _excess1Cost = ex1;
      _excess2Cost = ex2;
      _totalCost = base + ex1 + ex2;
    });
  }

  void _submitReading() async {
    final current = double.tryParse(_readingController.text);
    if (current == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Ingrese una lectura válida')));
      return;
    }

    if (current < (_actualPreviousReading?.currentReading ?? 0)) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('La lectura actual no puede ser menor a la anterior')));
      return;
    }

    setState(() => _isSaving = true);
    final token = Provider.of<AuthProvider>(context, listen: false).token;
    final now = DateTime.now();

    try {
      if (_isEditMode && _existingReadingId != null) {
        // Lógica de actualización (Podrías crear un ApiService.updateReading si el backend lo requiere)
        await ApiService.createReading(
          token: token!,
          customerId: widget.customer.id,
          currentReading: current,
          month: now.month,
          year: now.year,
          notes: _notesController.text,
        );
      } else {
        await ApiService.createReading(
          token: token!,
          customerId: widget.customer.id,
          currentReading: current,
          month: now.month,
          year: now.year,
          notes: _notesController.text,
        );
      }
      setState(() {
        _isSaving = false;
        _isSaved = true;
      });
      _printReceipt();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
        setState(() => _isSaving = false);
      }
    }
  }

  void _connectToPrinter() {
    PrintService.discoverAndConnect((status) {
      if (mounted) {
        setState(() => _printStatus = status);
      }
    });
  }

  void _printReceipt() async {
    try {
      await PrintService.printReceipt(
        customerName: widget.customer.userName ?? 'Cliente',
        customerCode: widget.customer.customerCode,
        previousReading: _actualPreviousReading?.currentReading ?? 0,
        currentReading: double.parse(_readingController.text),
        consumption: double.parse(_readingController.text) - (_actualPreviousReading?.currentReading ?? 0),
        totalAmount: _totalCost,
        notes: _notesController.text,
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error al imprimir: $e')));
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
            child: _isSaved ? _buildSuccessState() : _buildFormState(),
          ),
    );
  }

  Widget _buildFormState() {
    return Column(
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
          '${_actualPreviousReading?.currentReading.toStringAsFixed(1) ?? "0.0"} m³',
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
          const SizedBox(height: 20),
          _buildPriceDetailCard(),
        ],
        const SizedBox(height: 30),

        // Notes
        Container(
          padding: const EdgeInsets.all(15),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.05),
            borderRadius: BorderRadius.circular(15),
            border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
          ),
          child: TextField(
            controller: _notesController,
            maxLines: 3,
            style: const TextStyle(color: Colors.white, fontSize: 14),
            decoration: const InputDecoration(
              labelText: 'OBSERVACIONES / NOTAS',
              labelStyle: TextStyle(color: Color(0xFF64748B), fontSize: 12, fontWeight: FontWeight.bold),
              border: InputBorder.none,
              hintText: 'Ej. Medidor con fuga, no se pudo ver bien...',
              hintStyle: TextStyle(color: Color(0xFF334155), fontSize: 14),
            ),
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
              : Text(
                  _isEditMode ? 'ACTUALIZAR LECTURA' : 'GUARDAR LECTURA', 
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white)
                ),
          ),
        ),
      ],
    );
  }

  Widget _buildPriceDetailCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.greenAccent.withValues(alpha: 0.3)),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('DETALLE DE CONSUMO', style: GoogleFonts.outfit(color: Colors.greenAccent, fontWeight: FontWeight.bold, fontSize: 12)),
              Text('${_calculatedConsumption.toStringAsFixed(1)} m³', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            ],
          ),
          const Divider(color: Colors.white10, height: 25),
          _buildPriceRow('Mínimo Base (10 m³)', _baseCost),
          if (_excess1Cost > 0) _buildPriceRow('Excedente 1 (11-25 m³)', _excess1Cost),
          if (_excess2Cost > 0) _buildPriceRow('Excedente 2 (>25 m³)', _excess2Cost),
          const Divider(color: Colors.white10, height: 25),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('TOTAL ESTIMADO', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
              Text('Bs. ${_totalCost.toStringAsFixed(2)}', style: GoogleFonts.outfit(color: Colors.greenAccent, fontWeight: FontWeight.bold, fontSize: 22)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPriceRow(String label, double price) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13)),
          Text('Bs. ${price.toStringAsFixed(2)}', style: const TextStyle(color: Colors.white, fontSize: 13)),
        ],
      ),
    );
  }

  Widget _buildSuccessState() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const SizedBox(height: 50),
        const Icon(LucideIcons.checkCircle, color: Colors.greenAccent, size: 100),
        const SizedBox(height: 30),
        Text(
          '¡Lectura Guardada!',
          style: GoogleFonts.outfit(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 10),
        Text(
          'El registro se completó correctamente.',
          style: TextStyle(color: const Color(0xFF64748B)),
        ),
        const SizedBox(height: 40),
        
        // Print Button
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: const Color(0xFF1E293B),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
          ),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(LucideIcons.printer, color: Colors.blueAccent, size: 20),
                  const SizedBox(width: 10),
                  Text(
                    _printStatus.isEmpty ? 'Listo para imprimir' : _printStatus,
                    style: TextStyle(color: Colors.blueAccent, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                height: 55,
                child: ElevatedButton.icon(
                  onPressed: _printReceipt,
                  icon: const Icon(LucideIcons.printer),
                  label: const Text('IMPRIMIR BOLETA'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blueAccent,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ),
            ],
          ),
        ),
        
        const SizedBox(height: 30),
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('FINALIZAR Y VOLVER', style: TextStyle(color: Color(0xFF64748B))),
        ),
      ],
    );
  }
}
