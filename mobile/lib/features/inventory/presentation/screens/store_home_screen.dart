import 'package:flutter/material.dart';
import '../../../../main.dart';
import '../../../../core/constants/app_colors.dart';
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
      final palette = AppColors.of(context);
      setState(() {
        _searchQuery = scannedCode;
        _searchController.text = scannedCode;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Código escaneado: $scannedCode',
            style: TextStyle(color: palette.accentForeground, fontWeight: FontWeight.bold),
          ),
          backgroundColor: palette.optimalGreen,
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  Future<void> _handleConfirmItem(StoreItem item) async {
    setState(() => item.isCounted = !item.isCounted);
    await _apiService.recordStoreSale(item.sku, 0);

    if (mounted) {
      final palette = AppColors.of(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Conteo verificado en rack para ${item.sku}',
            style: TextStyle(color: palette.textPrimary),
          ),
          backgroundColor: palette.surface,
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final palette = AppColors.of(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final filtered = _items
        .where((x) =>
            x.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
            x.sku.toLowerCase().contains(_searchQuery.toLowerCase()))
        .toList();

    final criticalCount = _items.where((x) => x.level == AlertLevel.critical).length;
    final warningCount = _items.where((x) => x.level == AlertLevel.warning).length;
    final optimalCount = _items.where((x) => x.level == AlertLevel.optimal).length;

    return Scaffold(
      backgroundColor: palette.background,
      appBar: AppBar(
        backgroundColor: palette.background,
        elevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'SportStock',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: palette.textPrimary),
            ),
            Text(
              'Sucursal Costanera Center',
              style: TextStyle(fontSize: 12, color: palette.textMuted),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(
              isDark ? Icons.light_mode_outlined : Icons.dark_mode_outlined,
              color: palette.textSecondary,
            ),
            tooltip: isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro',
            onPressed: () => toggleAppThemeMode(context),
          ),
          IconButton(
            icon: Icon(Icons.qr_code_scanner, color: palette.optimalGreen),
            tooltip: 'Escanear SKU',
            onPressed: _openScanner,
          ),
          CircleAvatar(
            radius: 16,
            backgroundColor: palette.optimalGreenBg,
            child: Text(
              'MG',
              style: TextStyle(fontSize: 10, color: palette.optimalGreen, fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(width: 16),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: palette.optimalGreen,
        foregroundColor: palette.accentForeground,
        icon: const Icon(Icons.qr_code_scanner),
        label: const Text('Escanear', style: TextStyle(fontWeight: FontWeight.bold)),
        onPressed: _openScanner,
      ),
      body: RefreshIndicator(
        color: palette.optimalGreen,
        backgroundColor: palette.surface,
        onRefresh: _loadInventory,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Saludo de turno
              Text(
                'Hola, Matías',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: palette.textPrimary),
              ),
              const SizedBox(height: 4),
              Text('Turno mañana · 08:00–16:00', style: TextStyle(fontSize: 12, color: palette.textMuted)),
              const SizedBox(height: 16),

              // Semáforo dinámico de contadores
              Container(
                padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
                decoration: BoxDecoration(
                  color: palette.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: palette.border),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _buildCounter(palette, '$criticalCount', 'Críticos', palette.criticalRed),
                    _buildDivider(palette),
                    _buildCounter(palette, '$warningCount', 'Preventivos', palette.warningAmber),
                    _buildDivider(palette),
                    _buildCounter(palette, '$optimalCount', 'Óptimos', palette.optimalGreen),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Buscador
              TextField(
                controller: _searchController,
                style: TextStyle(color: palette.textPrimary, fontSize: 14),
                onChanged: (val) => setState(() => _searchQuery = val),
                decoration: InputDecoration(
                  hintText: 'Buscar SKU o producto...',
                  hintStyle: TextStyle(fontSize: 13, color: palette.textMuted),
                  prefixIcon: Icon(Icons.search, color: palette.textMuted),
                  suffixIcon: _searchQuery.isNotEmpty
                      ? IconButton(
                          icon: Icon(Icons.clear, color: palette.textMuted, size: 18),
                          onPressed: () {
                            _searchController.clear();
                            setState(() => _searchQuery = '');
                          },
                        )
                      : IconButton(
                          icon: Icon(Icons.qr_code_scanner, color: palette.optimalGreen),
                          onPressed: _openScanner,
                        ),
                  filled: true,
                  fillColor: palette.surface,
                  contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 16),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: BorderSide(color: palette.border),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: BorderSide(color: palette.border),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: BorderSide(color: palette.optimalGreen, width: 1.5),
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Feed de Alertas Prioritarias
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Prioridad para hoy',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: palette.textPrimary),
                  ),
                  if (_isLoading)
                    SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2, color: palette.optimalGreen),
                    ),
                ],
              ),
              const SizedBox(height: 12),

              if (filtered.isEmpty && !_isLoading)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: palette.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: palette.border),
                  ),
                  child: Column(
                    children: [
                      Icon(Icons.search_off, color: palette.textMuted, size: 36),
                      const SizedBox(height: 8),
                      Text(
                        _searchQuery.isEmpty ? 'No hay registros cargados' : 'No se encontró el SKU "$_searchQuery"',
                        style: TextStyle(color: palette.textMuted, fontSize: 13),
                      ),
                    ],
                  ),
                )
              else
                ...filtered.map((item) => _buildAlertCard(palette, item)),
              const SizedBox(height: 70),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCounter(AppPalette palette, String count, String label, Color color) {
    return Column(
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(width: 8, height: 8, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
            const SizedBox(width: 6),
            Text(count, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: palette.textPrimary)),
          ],
        ),
        const SizedBox(height: 4),
        Text(label, style: TextStyle(fontSize: 10, color: palette.textMuted)),
      ],
    );
  }

  Widget _buildDivider(AppPalette palette) {
    return Container(width: 1, height: 28, color: palette.border);
  }

  Widget _buildAlertCard(AppPalette palette, StoreItem item) {
    final isCritical = item.level == AlertLevel.critical;
    final isWarning = item.level == AlertLevel.warning;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: palette.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: palette.border),
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
                      ? palette.criticalRedBg
                      : isWarning
                          ? palette.warningAmberBg
                          : palette.optimalGreenBg,
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
                        ? palette.criticalRed
                        : isWarning
                            ? palette.warningAmber
                            : palette.optimalGreen,
                  ),
                ),
              ),
              Text(item.sku, style: TextStyle(fontSize: 10, color: palette.textMuted, fontFamily: 'monospace')),
            ],
          ),
          const SizedBox(height: 10),
          Text(item.title, style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: palette.textPrimary)),
          Text(item.variant, style: TextStyle(fontSize: 11, color: palette.textMuted)),
          const SizedBox(height: 12),

          // Stock Info Row
          Container(
            padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
            decoration: BoxDecoration(color: palette.background, borderRadius: BorderRadius.circular(8)),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Stock actual', style: TextStyle(fontSize: 9, color: palette.textMuted)),
                    Text(
                      '${item.stockActual} u.',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: isCritical
                            ? palette.criticalRed
                            : isWarning
                                ? palette.warningAmber
                                : palette.optimalGreen,
                      ),
                    ),
                  ],
                ),
                Container(width: 1, height: 20, color: palette.border),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Mínimo requerido', style: TextStyle(fontSize: 9, color: palette.textMuted)),
                    Text('${item.stockMinimo} u.', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: palette.textPrimary)),
                  ],
                ),
                Container(width: 1, height: 20, color: palette.border),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Llega reposición', style: TextStyle(fontSize: 9, color: palette.textMuted)),
                    Text(item.etaReposicion, style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: palette.optimalGreen)),
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
                foregroundColor: item.isCounted ? palette.textMuted : palette.optimalGreen,
                side: BorderSide(color: item.isCounted ? palette.border : palette.optimalGreen),
                backgroundColor: item.isCounted ? palette.optimalGreenBg : Colors.transparent,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              onPressed: () => _handleConfirmItem(item),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (item.isCounted) const Icon(Icons.check, size: 16),
                  if (item.isCounted) const SizedBox(width: 6),
                  Text(
                    item.isCounted ? 'Conteo confirmado' : 'Confirmar conteo en rack',
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
