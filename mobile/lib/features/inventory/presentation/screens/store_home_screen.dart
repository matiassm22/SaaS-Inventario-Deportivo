import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../domain/models/store_item.dart';

class StoreHomeScreen extends StatefulWidget {
  const StoreHomeScreen({super.key});

  @override
  State<StoreHomeScreen> createState() => _StoreHomeScreenState();
}

class _StoreHomeScreenState extends State<StoreHomeScreen> {
  final List<StoreItem> _items = [
    StoreItem(
      sku: 'RUN-001',
      title: 'Nike Vaporfly 3',
      variant: 'Talla 42 · Running',
      stockActual: 3,
      stockMinimo: 8,
      etaReposicion: 'Jueves 26',
      level: AlertLevel.critical,
    ),
    StoreItem(
      sku: 'RUN-008',
      title: 'Cortaviento Trail Shield',
      variant: 'Talla M · Running',
      stockActual: 6,
      stockMinimo: 12,
      etaReposicion: 'Viernes 27',
      level: AlertLevel.critical,
    ),
    StoreItem(
      sku: 'FUT-023',
      title: 'Balón Torneo Pro Match N°5',
      variant: 'Fútbol',
      stockActual: 12,
      stockMinimo: 18,
      etaReposicion: 'Lunes 30',
      level: AlertLevel.warning,
    ),
  ];

  String _searchQuery = '';

  @override
  Widget build(BuildContext context) {
    final filtered = _items
        .where((x) =>
            x.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
            x.sku.toLowerCase().contains(_searchQuery.toLowerCase()))
        .toList();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: const [
            Text('SportStock', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            Text('Sucursal Costanera Center', style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
          ],
        ),
        actions: [
          CircleAvatar(
            radius: 16,
            backgroundColor: AppColors.optimalGreenBg,
            child: const Text('MG', style: TextStyle(fontSize: 10, color: AppColors.optimalGreen, fontWeight: FontWeight.bold)),
          ),
          const SizedBox(width: 16),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Saludo de turno
            const Text('Hola, Matías', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
            const SizedBox(height: 4),
            const Text('Turno mañana · 08:00–16:00', style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
            const SizedBox(height: 16),

            // Semáforo de 3 contadores
            Container(
              padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _buildCounter('4', 'Críticos', AppColors.criticalRed),
                  _buildDivider(),
                  _buildCounter('7', 'Preventivos', AppColors.warningAmber),
                  _buildDivider(),
                  _buildCounter('142', 'Óptimos', AppColors.optimalGreen),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Buscador
            TextField(
              onChanged: (val) => setState(() => _searchQuery = val),
              decoration: InputDecoration(
                hintText: 'Buscar SKU o producto...',
                hintStyle: const TextStyle(fontSize: 13, color: AppColors.textMuted),
                prefixIcon: const Icon(Icons.search, color: AppColors.textMuted),
                suffixIcon: IconButton(
                  icon: const Icon(Icons.qr_code_scanner, color: AppColors.optimalGreen),
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Lector de código de barras activo.')),
                    );
                  },
                ),
                filled: true,
                fillColor: AppColors.surface,
                contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 16),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: AppColors.border),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: AppColors.border),
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Feed de Alertas Prioritarias
            const Text('Prioridad para hoy', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
            const SizedBox(height: 12),

            ...filtered.map((item) => _buildAlertCard(item)),
          ],
        ),
      ),
    );
  }

  Widget _buildCounter(String count, String label, Color color) {
    return Column(
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(width: 8, height: 8, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
            const SizedBox(width: 6),
            Text(count, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
          ],
        ),
        const SizedBox(height: 4),
        Text(label, style: const TextStyle(fontSize: 10, color: AppColors.textMuted)),
      ],
    );
  }

  Widget _buildDivider() {
    return Container(width: 1, height: 28, color: AppColors.border);
  }

  Widget _buildAlertCard(StoreItem item) {
    final isCritical = item.level == AlertLevel.critical;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: isCritical ? AppColors.criticalRedBg : AppColors.warningAmberBg,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  isCritical ? 'Quiebre inminente' : 'Preventivo',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: isCritical ? AppColors.criticalRed : AppColors.warningAmber,
                  ),
                ),
              ),
              Text(item.sku, style: const TextStyle(fontSize: 10, color: AppColors.textMuted, fontFamily: 'monospace')),
            ],
          ),
          const SizedBox(height: 10),
          Text(item.title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
          Text(item.variant, style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
          const SizedBox(height: 12),

          // Stock Info Row
          Container(
            padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
            decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(8)),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Stock actual', style: TextStyle(fontSize: 9, color: AppColors.textMuted)),
                    Text('${item.stockActual} u.', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: isCritical ? AppColors.criticalRed : AppColors.warningAmber)),
                  ],
                ),
                Container(width: 1, height: 20, color: AppColors.border),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Mínimo requerido', style: TextStyle(fontSize: 9, color: AppColors.textMuted)),
                    Text('${item.stockMinimo} u.', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                  ],
                ),
                Container(width: 1, height: 20, color: AppColors.border),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Llega reposición', style: TextStyle(fontSize: 9, color: AppColors.textMuted)),
                    Text(item.etaReposicion, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.optimalGreen)),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Botón Confirmar Conteo
          SizedBox(
            width: double.infinity,
            height: 38,
            child: OutlinedButton(
              style: OutlinedButton.styleFrom(
                foregroundColor: item.isCounted ? AppColors.textMuted : AppColors.optimalGreen,
                side: BorderSide(color: item.isCounted ? AppColors.border : AppColors.optimalGreen),
                backgroundColor: item.isCounted ? AppColors.optimalGreenBg.withOpacity(0.3) : Colors.transparent,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              onPressed: () {
                setState(() => item.isCounted = !item.isCounted);
              },
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (item.isCounted) const Icon(Icons.check, size: 16),
                  if (item.isCounted) const SizedBox(width: 6),
                  Text(item.isCounted ? 'Conteo confirmado' : 'Confirmar conteo en rack', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
