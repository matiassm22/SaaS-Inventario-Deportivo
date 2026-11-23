enum AlertLevel { critical, warning, optimal }

class StoreItem {
  final String sku;
  final String title;
  final String variant;
  final int stockActual;
  final int stockMinimo;
  final String etaReposicion;
  final AlertLevel level;
  bool isCounted;

  StoreItem({
    required this.sku,
    required this.title,
    required this.variant,
    required this.stockActual,
    required this.stockMinimo,
    required this.etaReposicion,
    required this.level,
    this.isCounted = false,
  });
}
