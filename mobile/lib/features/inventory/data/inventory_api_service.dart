import 'dart:convert';
import 'package:http/http.dart' as http;
import '../domain/models/store_item.dart';

class InventoryApiService {
  // En emulador Android usar 10.0.2.2; en desktop/web usar localhost o IP de red local
  final String baseUrl;

  InventoryApiService({this.baseUrl = 'http://10.0.2.2:3000/api/v1'});

  /// Consulta el inventario de tienda en vivo desde el backend de SportStockAI
  Future<List<StoreItem>> fetchStoreInventory({String? sucursalId}) async {
    try {
      final uri = Uri.parse('$baseUrl/tienda/inventario').replace(
        queryParameters: sucursalId != null ? {'sucursal_id': sucursalId} : null,
      );

      final response = await http.get(uri).timeout(const Duration(seconds: 4));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true && data['data'] is List) {
          return (data['data'] as List)
              .map((item) => StoreItem.fromJson(item))
              .toList();
        }
      }
    } catch (_) {
      // Si la red no está disponible, utiliza almacenamiento de contingencia
    }

    return _fallbackItems();
  }

  /// Registra una venta o ajuste de stock desde la tienda física
  Future<bool> recordStoreSale(String sku, int units, {String? sucursalId}) async {
    try {
      final uri = Uri.parse('$baseUrl/tienda/venta');
      final response = await http.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'sku_codigo': sku,
          'unidades': units,
          if (sucursalId != null) 'sucursal_id': sucursalId,
        }),
      ).timeout(const Duration(seconds: 4));

      return response.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  /// Catálogo local de contingencia en caso de desconexión
  List<StoreItem> _fallbackItems() {
    return [
      StoreItem(
        sku: 'RUN-001',
        title: 'Nike Vaporfly 3',
        variant: 'RUNNING · Reposición 2d',
        stockActual: 3,
        stockMinimo: 8,
        etaReposicion: 'En 2 días hábiles',
        level: AlertLevel.critical,
      ),
      StoreItem(
        sku: 'RUN-008',
        title: 'Cortaviento Trail Shield',
        variant: 'RUNNING · Reposición 2d',
        stockActual: 6,
        stockMinimo: 12,
        etaReposicion: 'En 2 días hábiles',
        level: AlertLevel.critical,
      ),
      StoreItem(
        sku: 'FUT-023',
        title: 'Balón Torneo Pro Match N°5',
        variant: 'FUTBOL · Reposición 3d',
        stockActual: 12,
        stockMinimo: 18,
        etaReposicion: 'En 3 días hábiles',
        level: AlertLevel.warning,
      ),
      StoreItem(
        sku: 'FIT-012',
        title: 'Polera Compresión Dry-Fit',
        variant: 'FITNESS · Reposición 4d',
        stockActual: 18,
        stockMinimo: 20,
        etaReposicion: 'En 4 días hábiles',
        level: AlertLevel.warning,
      ),
      StoreItem(
        sku: 'FUT-104',
        title: 'Camiseta Local Oficial 2026',
        variant: 'FUTBOL · Reposición 3d',
        stockActual: 45,
        stockMinimo: 20,
        etaReposicion: 'En 3 días hábiles',
        level: AlertLevel.optimal,
      ),
    ];
  }
}
