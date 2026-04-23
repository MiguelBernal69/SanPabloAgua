import 'dart:io';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:image_picker/image_picker.dart';
import 'package:geolocator/geolocator.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../providers/auth_provider.dart';
import '../models/customer_model.dart';
import '../services/api_service.dart';

class EditCustomerScreen extends StatefulWidget {
  final Customer customer;

  const EditCustomerScreen({super.key, required this.customer});

  @override
  State<EditCustomerScreen> createState() => _EditCustomerScreenState();
}

class _EditCustomerScreenState extends State<EditCustomerScreen> {
  File? _imageFile;
  bool _isUpdatingLocation = false;
  bool _isSaving = false;
  double? _currentLat;
  double? _currentLng;

  @override
  void initState() {
    super.initState();
    _currentLat = widget.customer.latitude;
    _currentLng = widget.customer.longitude;
  }

  Future<void> _takePhoto() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(
      source: ImageSource.camera,
      imageQuality: 50,
    );

    if (pickedFile != null) {
      setState(() {
        _imageFile = File(pickedFile.path);
      });
      _uploadPhoto();
    }
  }

  Future<void> _uploadPhoto() async {
    if (_imageFile == null) return;

    setState(() => _isSaving = true);
    final token = Provider.of<AuthProvider>(context, listen: false).token;

    try {
      await ApiService.uploadCustomerPhoto(widget.customer.id, _imageFile!, token!);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Foto actualizada con éxito')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error al subir foto: $e')),
        );
      }
    } finally {
      setState(() => _isSaving = false);
    }
  }

  Future<void> _updateLocation() async {
    setState(() => _isUpdatingLocation = true);

    try {
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }

      if (permission == LocationPermission.whileInUse || permission == LocationPermission.always) {
        Position position = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.high,
        );

        final token = Provider.of<AuthProvider>(context, listen: false).token;
        await ApiService.updateCustomerTechnicalData(
          widget.customer.id, 
          position.latitude, 
          position.longitude, 
          token!
        );

        setState(() {
          _currentLat = position.latitude;
          _currentLng = position.longitude;
        });

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Ubicación actualizada correctamente')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error al obtener ubicación: $e')),
        );
      }
    } finally {
      setState(() => _isUpdatingLocation = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    // URL base para las imágenes (ajustar según tu entorno)
    const String baseUrl = 'http://192.168.100.4:4000'; // Tu IP real de servidor

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text(
          'Perfil Técnico',
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white),
        ),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Customer Info Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 30,
                    backgroundColor: Colors.blueAccent.withValues(alpha: 0.1),
                    child: const Icon(LucideIcons.user, color: Colors.blueAccent, size: 30),
                  ),
                  const SizedBox(width: 20),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.customer.userName ?? 'Cliente',
                          style: GoogleFonts.outfit(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          'Código: ${widget.customer.customerCode}',
                          style: const TextStyle(color: Color(0xFF94A3B8)),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 30),
            
            // Photo Section
            Text(
              'Foto de la Casa',
              style: GoogleFonts.outfit(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 15),
            Center(
              child: Stack(
                children: [
                  Container(
                    width: double.infinity,
                    height: 200,
                    decoration: BoxDecoration(
                      color: const Color(0xFF1E293B),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(20),
                      child: _imageFile != null
                          ? Image.file(_imageFile!, fit: BoxFit.cover)
                          : widget.customer.housePhoto != null
                              ? CachedNetworkImage(
                                  imageUrl: 'http://192.168.100.4:4000${widget.customer.housePhoto}',
                                  fit: BoxFit.cover,
                                  placeholder: (context, url) => const Center(child: CircularProgressIndicator()),
                                  errorWidget: (context, url, error) => const Icon(LucideIcons.image, size: 50, color: Color(0xFF64748B)),
                                )
                              : const Icon(LucideIcons.image, size: 50, color: Color(0xFF64748B)),
                    ),
                  ),
                  Positioned(
                    bottom: 10,
                    right: 10,
                    child: FloatingActionButton(
                      mini: true,
                      onPressed: _isSaving ? null : _takePhoto,
                      backgroundColor: Colors.blueAccent,
                      child: _isSaving 
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : const Icon(LucideIcons.camera),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 30),

            // Location Section
            Text(
              'Ubicación GPS',
              style: GoogleFonts.outfit(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 15),
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
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildLocationInfo('Latitud', _currentLat?.toStringAsFixed(6) ?? 'No asignada'),
                      _buildLocationInfo('Longitud', _currentLng?.toStringAsFixed(6) ?? 'No asignada'),
                    ],
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _isUpdatingLocation ? null : _updateLocation,
                      icon: _isUpdatingLocation 
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                        : const Icon(LucideIcons.mapPin),
                      label: Text(_isUpdatingLocation ? 'Obteniendo GPS...' : 'Actualizar con mi ubicación actual'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.greenAccent.withValues(alpha: 0.1),
                        foregroundColor: Colors.greenAccent,
                        padding: const EdgeInsets.symmetric(vertical: 15),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLocationInfo(String label, String value) {
    return Column(
      children: [
        Text(label, style: const TextStyle(color: Color(0xFF64748B), fontSize: 12)),
        const SizedBox(height: 5),
        Text(
          value,
          style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold),
        ),
      ],
    );
  }
}
