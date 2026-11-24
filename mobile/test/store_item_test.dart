import 'package:flutter_test/flutter_test.dart';
import 'package:sportstock_mobile/features/inventory/domain/models/store_item.dart';

void main() {
  group('StoreItem - Modelo de Dominio de Tienda', () {
    test('Debe deserializar correctamente un item con estado crítico', () {
      final json = {
        'sku': 'RUN-001',
        'title': 'Nike Vaporfly 3',
        'variant': 'RUNNING · Reposición 2d',
        'stockActual': 3,
        'stockMinimo': 8,
        'etaReposicion': 'En 2 días hábiles',
        'level': 'critical',
      };

      final item = StoreItem.fromJson(json);

      expect(item.sku, 'RUN-001');
      expect(item.title, 'Nike Vaporfly 3');
      expect(item.stockActual, 3);
      expect(item.stockMinimo, 8);
      expect(item.level, AlertLevel.critical);
      expect(item.isCounted, false);
    });

    test('Debe clasificar preventivo y óptimo adecuadamente', () {
      final jsonWarning = {
        'sku': 'FUT-023',
        'title': 'Balón Pro Match',
        'variant': 'FUTBOL',
        'stockActual': 12,
        'stockMinimo': 18,
        'etaReposicion': 'En 3 días',
        'level': 'warning',
      };

      final item = StoreItem.fromJson(jsonWarning);
      expect(item.level, AlertLevel.warning);

      final jsonOptimal = {
        'sku': 'FUT-104',
        'title': 'Camiseta Oficial',
        'variant': 'FUTBOL',
        'stockActual': 45,
        'stockMinimo': 20,
        'etaReposicion': 'En 3 días',
        'level': 'optimal',
      };

      final itemOpt = StoreItem.fromJson(jsonOptimal);
      expect(itemOpt.level, AlertLevel.optimal);
    });

    test('Debe serializar de vuelta a Map JSON preservando atributos', () {
      final item = StoreItem(
        sku: 'FIT-012',
        title: 'Polera Dry-Fit',
        variant: 'FITNESS',
        stockActual: 18,
        stockMinimo: 20,
        etaReposicion: 'En 4 días',
        level: AlertLevel.warning,
        isCounted: true,
      );

      final json = item.toJson();
      expect(json['sku'], 'FIT-012');
      expect(json['stockActual'], 18);
      expect(json['isCounted'], true);
      expect(json['level'], 'warning');
    });
  });
}
