import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../data/inventory_api_service.dart';
import '../../domain/models/store_item.dart';
import 'barcode_scanner_screen.dart';

class StoreHomeScreen extends StatefulWidget {
  const StoreHomeScreen({super.key});

  @override
  State<StoreHomeScreen> createState() => _StoreHomeScreenState();
}

class _StoreHomeScreenState extends State<StoreHomeScreen> {
  final InventoryApiService _apiService = InventoryApiService();
  final TextEditingController _searchController = TextEditingController();

  List<StoreItem> _items = [];
  bool _isLoading = false;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _loadInventory();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadInventory() async {
    setState(() => _isLoading = true);
    final items = await _apiService.fetchStoreInventory();
    if (mounted) {
      setState(() {
        _items = items;
        _isLoading = false;
      });
    }
  }

  Future<void> _openScanner() async {
    final scannedCode = await Navigator.of(context).push<String>(
      MaterialPageRoute(builder: (context) => const BarcodeScannerScreen()),
    );

    if (scannedCode != null && scannedCode.isNotEmpty && mounted) {
      setState(() {
        _searchQuery = scannedCode;
        _searchController.text = scannedCode;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Código escaneado: $scannedCode'),
          backgroundColor: AppColors.optimalGreen,
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  Future<void> _handleConfirmItem(StoreItem item) async {
    setState(() => item.isCounted = !item.isCounted);
    await _apiService.recordStoreSale(item.sku, 0);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Conteo verificado en rack para ${item.sku}'),
          backgroundColor: AppColors.surface,
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _items
        .where((x) =>
            x.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
            x.sku.toLowerCase().contains(_searchQuery.toLowerCase()))
        .toList();

    final criticalCount = _items.where((x) => x.level == AlertLevel.critical).length;
    final warningCount = _items.where((x) => x.level == AlertLevel.warning).length;
    final optimalCount = _items.where((x) => x.level == AlertLevel.optimal).length;

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
          IconButton(
            icon: const Icon(Icons.qr_code_scanner, color: AppColors.optimalGreen),
            tooltip: 'Escanear SKU',
            onPressed: _openScanner,
          ),
          CircleAvatar(
            radius: 16,
            backgroundColor: AppColors.optimalGreenBg,
            child: const Text('MG', style: TextStyle(fontSize: 10, color: AppColors.optimalGreen, fontWeight: FontWeight.bold)),
          ),
          const SizedBox(width: 16),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppColors.optimalGreen,
        foregroundColor: Colors.black,
        icon: const Icon(Icons.qr_code_scanner),
        label: const Text('Escanear', style: TextStyle(fontWeight: FontWeight.bold)),
        onPressed: _openScanner,
      ),
      body: RefreshIndicator(
        color: AppColors.optimalGreen,
        backgroundColor: AppColors.surface,
        onRefresh: _loadInventory,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Saludo de turno
              const Text('Hola, Matías', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
              const SizedBox(height: 4),
              const Text('Turno mañana · 08:00–16:00', style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
              const SizedBox(height: 16),

              // Semáforo dinámico de contadores
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
                    _buildCounter('$criticalCount', 'Críticos', AppColors.criticalRed),
                    _buildDivider(),
                    _buildCounter('$warningCount', 'Preventivos', AppColors.warningAmber),
                    _buildDivider(),
                    _buildCounter('$optimalCount', 'Óptimos', AppColors.optimalGreen),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Buscador
              TextField(
                controller: _searchController,
                onChanged: (val) => setState(() => _searchQuery = val),
                decoration: InputDecoration(
                  hintText: 'Buscar SKU o producto...',
                  hintStyle: const TextStyle(fontSize: 13, color: AppColors.textMuted),
                  prefixIcon: const Icon(Icons.search, color: AppColors.textMuted),
                  suffixIcon: _searchQuery.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear, color: AppColors.textMuted, size: 18),
                          onPressed: () {
                            _searchController.clear();
                            setState(() => _searchQuery = '');
                          },
                        )
                      : IconButton(
                          icon: const Icon(Icons.qr_code_scanner, color: AppColors.optimalGreen),
                          onPressed: _openScanner,
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
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Prioridad para hoy', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                  if (_isLoading)
                    const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.optimalGreen),
                    ),
                ],
              ),
              const SizedBox(height: 12),

              if (filtered.isEmpty && !_isLoading)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Column(
                    children: [
                      const Icon(Icons.search_off, color: AppColors.textMuted, size: 36),
                      const SizedBox(height: 8),
                      Text(
                        _searchQuery.isEmpty ? 'No hay registros cargados' : 'No se encontró el SKU "$_searchQuery"',
                        style: const TextStyle(color: AppColors.textMuted, fontSize: 13),
                      ),
                    ],
                  ),
                )
              else
                ...filtered.map((item) => _buildAlertCard(item)),
              const SizedBox(height: 70), // Espacio para el FloatingActionButton
            ],
          ),
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
    final isWarning = item.level == AlertLevel.warning;

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
                  color: isCritical
                      ? AppColors.criticalRedBg
                      : isWarning
                          ? AppColors.warningAmberBg
                          : AppColors.optimalGreenBg,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  isCritical
                      ? 'Quiebre inminente'
                      : isWarning
                          ? 'Preventivo'
                          : 'Óptimo',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: isCritical
                        ? AppColors.criticalRed
                        : isWarning
                            ? AppColors.warningAmber
                            : AppColors.optimalGreen,
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
                    Text(
                      '${item.stockActual} u.',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: isCritical
                            ? AppColors.criticalRed
                            : isWarning
                                ? AppColors.warningAmber
                                : AppColors.optimalGreen,
                      ),
                    ),
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
              onPressed: () => _handleConfirmItem(item),
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
