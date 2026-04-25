import 'package:blue_thermal_printer/blue_thermal_printer.dart';
import 'package:permission_handler/permission_handler.dart';
import 'dart:async';
import 'dart:typed_data';
import 'dart:convert';

class PrintService {
  static BlueThermalPrinter bluetooth = BlueThermalPrinter.instance;
  static BluetoothDevice? _connectedDevice;

  static Future<bool> requestPermissions() async {
    Map<Permission, PermissionStatus> statuses = await [
      Permission.bluetooth,
      Permission.bluetoothScan,
      Permission.bluetoothConnect,
      Permission.location,
    ].request();

    return statuses.values.every((status) => status.isGranted);
  }

  static Future<void> discoverAndConnect(Function(String) onStatus) async {
    bool hasPermission = await requestPermissions();
    if (!hasPermission) {
      onStatus("Permisos denegados");
      return;
    }

    onStatus("Buscando impresora...");
    List<BluetoothDevice> devices = await bluetooth.getBondedDevices();
    
    if (devices.isEmpty) {
      onStatus("No hay impresoras emparejadas");
      return;
    }

    try {
      _connectedDevice = devices.first;
      onStatus("Conectando a ${_connectedDevice!.name}...");
      await bluetooth.connect(_connectedDevice!);
      onStatus("¡Impresora Lista!");
    } catch (e) {
      onStatus("Error al conectar: $e");
    }
  }

  static Future<void> printReceipt({
    required String customerName,
    required String customerCode,
    required double previousReading,
    required double currentReading,
    required double consumption,
    required double totalAmount,
  }) async {
    bool? isConnected = await bluetooth.isConnected;
    if (isConnected != true) throw Exception("Impresora desconectada");

    String dateStr = "${DateTime.now().day}/${DateTime.now().month}/${DateTime.now().year}";

    // 1. MODO HÍBRIDO (Para que funcione con ESTA y OTRAS aplicaciones)
    String switchCommand = "! U1 setvar \"device.languages\" \"hybrid\"\r\n";
    await bluetooth.writeBytes(Uint8List.fromList(utf8.encode(switchCommand)));
    await Future.delayed(const Duration(milliseconds: 500)); 

    // 2. DISEÑO ZPL OPTIMIZADO
    String zpl = """
^XA
^CI28
^CF0,30
^FO50,50^A0N,50,50^FDURBANIZACION SAN PABLO^FS
^FO50,110^A0N,30,30^FDSacaba - Bolivia^FS
^FO50,150^A0N,40,40^FDAVISO DE COBRANZA^FS
^FO50,200^GB700,2,2^FS
^FO50,230^A0N,25,25^FDNOMBRE DEL SOCIO:^FS
^FO50,260^A0N,35,35^FD${customerName.toUpperCase()}^FS
^FO50,320^GB700,1,1^FS
^FO50,340^A0N,30,30^FDCODIGO MEDIDOR:^FS
^FO450,340^A0N,30,30^FD$customerCode^FS
^FO50,390^A0N,30,30^FDLECTURA ANTERIOR:^FS
^FO450,390^A0N,30,30^FD${previousReading.toStringAsFixed(1)} m3^FS
^FO50,440^A0N,30,30^FDLECTURA ACTUAL:^FS
^FO450,440^A0N,30,30^FD${currentReading.toStringAsFixed(1)} m3^FS
^FO50,490^GB700,2,2^FS
^FO50,520^A0N,35,35^FDMTS. CONSUMIDOS:^FS
^FO450,520^A0N,45,45^FD${consumption.toStringAsFixed(1)} m3^FS
^FO50,580^GB700,3,3^FS
^FO150,620^A0N,40,40^FDTOTAL A PAGAR^FS
^FO150,670^A0N,70,70^FDBS. ${totalAmount.toStringAsFixed(2)}^FS
^FO50,760^GB700,2,2^FS
^FO50,790^A0N,25,25^FDFECHA EMISION: $dateStr^FS
^FO50,820^A0N,25,25^FDVENCIMIENTO:  30/${DateTime.now().month}/${DateTime.now().year}^FS
^FO50,890^A0N,30,30^FDGRACIAS POR SU PAGO PUNTUAL^FS
^FO50,930^A0N,20,20^FDEl agua de hoy es vida para manana^FS
^XZ
""";

    // 3. ENVÍO POR LÍNEAS (Para no saturar el buffer Bluetooth de la Zebra)
    for (var line in zpl.split('\n')) {
      if (line.trim().isNotEmpty) {
        await bluetooth.writeBytes(Uint8List.fromList(utf8.encode(line + "\n")));
        await Future.delayed(const Duration(milliseconds: 50)); 
      }
    }
  }
}
