import 'package:blue_thermal_printer/blue_thermal_printer.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:collection/collection.dart';
import 'dart:async';
import 'dart:typed_data';
import 'dart:convert';

class PrintService {
  static BlueThermalPrinter bluetooth = BlueThermalPrinter.instance;
  static BluetoothDevice? _connectedDevice;

  static Future<bool> requestPermissions() async {
    // Para Android 12+ (API 31+) necesitamos scan y connect
    // Para versiones anteriores necesitamos bluetooth y location
    Map<Permission, PermissionStatus> statuses = await [
      Permission.bluetoothScan,
      Permission.bluetoothConnect,
      Permission.bluetooth,
      Permission.location,
    ].request();

    bool scanOk = statuses[Permission.bluetoothScan]?.isGranted ?? true;
    bool connectOk = statuses[Permission.bluetoothConnect]?.isGranted ?? true;
    
    // Si estos dos son concedidos, lo demás suele ser opcional o para versiones viejas
    return scanOk && connectOk;
  }

  static Future<void> discoverAndConnect(Function(String) onStatus) async {
    bool hasPermission = await requestPermissions();
    if (!hasPermission) {
      onStatus("Permisos denegados");
      return;
    }

    try {
      onStatus("Buscando impresora...");
      List<BluetoothDevice> devices = await bluetooth.getBondedDevices();
      
      if (devices.isEmpty) {
        onStatus("No hay impresoras vinculadas en el sistema");
        return;
      }

      onStatus("Se encontraron ${devices.length} dispositivos");
      // Buscamos específicamente una que tenga "Zebra" o "ZQ320" en el nombre
      BluetoothDevice? zebra = devices.where((d) => 
        d.name?.toLowerCase().contains("zebra") == true || 
        d.name?.toLowerCase().contains("zq320") == true
      ).firstOrNull;

      if (zebra == null) {
        onStatus("No se encontró una Zebra vinculada. Conectando al primero...");
        _connectedDevice = devices.first;
      } else {
        _connectedDevice = zebra;
      }

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
    String notes = '',
  }) async {
    bool? isConnected = await bluetooth.isConnected;
    
    if (isConnected != true) {
      throw Exception("Impresora desconectada. Pulsa el botón 'ARREGLAR IMPRESORA' primero.");
    }

    DateTime now = DateTime.now();
    int previousMonthIndex = now.month - 1;
    int billingYear = now.year;
    if (previousMonthIndex == 0) {
      previousMonthIndex = 12;
      billingYear -= 1;
    }
    List<String> months = ["", "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
    String billingMonth = "${months[previousMonthIndex]} $billingYear";

    // Cálculo del desglose para la boleta
    double basicM3 = consumption > 10 ? 10 : consumption;
    double exc1M3 = consumption > 10 ? (consumption > 25 ? 15 : consumption - 10) : 0;
    double exc2M3 = consumption > 25 ? consumption - 25 : 0;
    
    double basicCost = 37.0;
    double exc1Cost = exc1M3 * 3.0;
    double exc2Cost = exc2M3 * 8.0;

    String dateStr = "${now.day}/${now.month}/${now.year} ${now.hour}:${now.minute.toString().padLeft(2, '0')}";
    
    // Ya no enviamos los comandos de configuración 'setvar' aquí
    // para evitar que la impresora cierre la conexión (Broken pipe).
    // La configuración se hace una sola vez desde el botón "Arreglar Impresora".
    
    await Future.delayed(const Duration(milliseconds: 100));

    // DISEÑO FINAL CENTRADO CON NOTAS
    // Bajamos las coordenadas Y para dar margen de corte (Y + 60)
    String notesSection = notes.isNotEmpty ? "^FO50,840^A0N,25,25^FDNOTA: $notes^FS" : "";
    int labelLength = notes.isNotEmpty ? 1050 : 950;
    int footerPosition = notes.isNotEmpty ? 910 : 870;

    // DISEÑO FINAL CENTRADO Y DETALLADO
    String zpl = """
^XA
^CI28
^LL$labelLength
^PW570
^FO0,100^FB570,1,0,C^A0N,45,45^FDURB. "SAN PABLO"^FS
^FO0,150^FB570,1,0,C^A0N,25,25^FDSacaba - Bolivia^FS

^FO0,190^FB570,2,0,C^A0N,20,20^FDEl agua de hoy es vida para mañana.\&cuidala y no la desperdicies^FS

^FO0,245^FB570,1,0,C^A0N,35,35^FDAVISO DE COBRANZA^FS
^FO50,285^GB470,1,2^FS

^FO50,300^A0N,25,25^FDNOMBRE DEL SOCIO:^FS
^FO50,330^A0N,30,30^FD${customerName.toUpperCase()}^FS
^FO50,370^A0N,25,25^FDCODIGO MEDIDOR:^FS
^FO300,370^A0N,25,25^FD$customerCode^FS
^FO50,405^A0N,25,25^FDMES AVISO:^FS
^FO300,405^A0N,30,30^FD$billingMonth^FS

^FO50,440^GB470,1,2^FS

^FO50,460^A0N,25,25^FDLECTURA ANTERIOR:^FS
^FO380,460^A0N,25,25^FD${previousReading.toStringAsFixed(1)} m3^FS
^FO50,495^A0N,25,25^FDLECTURA ACTUAL:^FS
^FO380,495^A0N,25,25^FD${currentReading.toStringAsFixed(1)} m3^FS

^FO50,530^GB470,1,2^FS

^FO50,550^A0N,30,30^FDMTS CONSUMIDOS:^FS
^FO380,550^A0N,35,35^FD${consumption.toStringAsFixed(1)} m3^FS

^FO50,590^GB470,1,2^FS

^FO50,610^A0N,22,22^FDConsumo Basico: 10 m3 = 37 Bs.^FS
^FO50,640^A0N,22,22^FDConsumo Excedido (10-25): ${exc1M3.toStringAsFixed(1)} m3 = ${exc1Cost.toStringAsFixed(1)} Bs.^FS
^FO50,670^A0N,22,22^FDConsumo Excedido (>25): ${exc2M3.toStringAsFixed(1)} m3 = ${exc2Cost.toStringAsFixed(1)} Bs.^FS

^FO50,705^GB470,1,2^FS

^FO50,730^A0N,35,35^FDTOTAL A PAGAR BS.^FS
^FO350,730^A0N,50,50^FD${totalAmount.toStringAsFixed(2)}^FS

^FO50,790^GB470,1,2^FS

^FO50,810^A0N,22,22^FDFECHA DE EMISION: $dateStr^FS

$notesSection

^FO0,$footerPosition^FB570,1,0,C^A0N,25,25^FDGRACIAS POR SU PAGO PUNTUAL^FS
^XZ
""";

    // Enviamos todo el bloque ZPL de una sola vez para evitar timeouts (Broken pipe)
    await bluetooth.writeBytes(Uint8List.fromList(utf8.encode(zpl)));
  }

  static Future<void> resetToHybrid(Function(String) onStatus) async {
    try {
      bool? isConnected = await bluetooth.isConnected;
      if (isConnected != true) {
        onStatus("Buscando impresora...");
        List<BluetoothDevice> devices = await bluetooth.getBondedDevices();
        if (devices.isEmpty) {
          onStatus("Error: Vincula la Zebra en Ajustes");
          return;
        }

        // Buscamos la Zebra
        BluetoothDevice? zebra = devices.where((d) => 
          d.name?.toLowerCase().contains("zebra") == true || 
          d.name?.toLowerCase().contains("zq320") == true
        ).firstOrNull;

        _connectedDevice = zebra ?? devices.first;
        onStatus("Conectando a ${_connectedDevice!.name}...");
        await bluetooth.connect(_connectedDevice!);
      }
      
      onStatus("Configurando Modo Híbrido...");
      // Forzamos modo ZPL y Papel Continuo (Journal)
      await bluetooth.writeBytes(Uint8List.fromList(utf8.encode("! U1 setvar \"device.languages\" \"zpl\"\r\n")));
      await Future.delayed(const Duration(milliseconds: 200));
      await bluetooth.writeBytes(Uint8List.fromList(utf8.encode("! U1 setvar \"media.type\" \"journal\"\r\n")));
      await Future.delayed(const Duration(milliseconds: 200));
      // Calibración rápida
      await bluetooth.writeBytes(Uint8List.fromList(utf8.encode("~jc^XA^JUS^XZ\r\n")));
      await Future.delayed(const Duration(milliseconds: 500));

      onStatus("Imprimiendo prueba...");
      // Una prueba simple en ZPL para confirmar que todo está OK
      String testZpl = "^XA^CI28^FO50,50^A0N,40,40^FDPRUEBA DE CONFIGURACION^FS^FO50,100^A0N,30,30^FDZebra Lista y Calibrada^FS^XZ";
      await bluetooth.writeBytes(Uint8List.fromList(utf8.encode(testZpl)));
      
      onStatus("¡Impresora Restaurada!");
      await Future.delayed(const Duration(seconds: 2));
      onStatus(""); 
    } catch (e) {
      onStatus("Error: $e");
    }
  }
}
