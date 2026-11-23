enum AlertLevel { critical, warning, optimal }

class StoreItem {
  final String sku;
  final String title;
  final String variant;
  int stockActual;
  final int stockMinimo;
  final String etaReposicion;
  AlertLevel level;
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

  factory StoreItem.fromJson(Map<String, dynamic> json) {
    AlertLevel parsedLevel = AlertLevel.optimal;
    final lvl = (json['level'] ?? '').toString().toLowerCase();
    if (lvl == 'critical' || lvl == 'critico') {
      parsedLevel = AlertLevel.critical;
    } else if (lvl == 'warning' || lvl == 'preventivo') {
      parsedLevel = AlertLevel.warning;
    }

    return StoreItem(
      sku: json['sku'] ?? '',
      title: json['title'] ?? '',
      variant: json['variant'] ?? '',
      stockActual: (json['stockActual'] as num?)?.toInt() ?? 0,
      stockMinimo: (json['stockMinimo'] as num?)?.toInt() ?? 0,
      etaReposicion: json['etaReposicion'] ?? '',
      level: parsedLevel,
      isCounted: json['isCounted'] == true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'sku': sku,
      'title': title,
      'variant': variant,
      'stockActual': stockActual,
      'stockMinimo': stockMinimo,
      'etaReposicion': etaReposicion,
      'level': level.name,
      'isCounted': isCounted,
    };
  }
}
