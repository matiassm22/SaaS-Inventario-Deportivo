import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../../../../core/constants/app_colors.dart';

class BarcodeScannerScreen extends StatefulWidget {
  const BarcodeScannerScreen({super.key});

  @override
  State<BarcodeScannerScreen> createState() => _BarcodeScannerScreenState();
}

class _BarcodeScannerScreenState extends State<BarcodeScannerScreen> {
  final MobileScannerController _controller = MobileScannerController(
    detectionSpeed: DetectionSpeed.noDuplicates,
    facing: CameraFacing.back,
    torchEnabled: false,
  );

  bool _isScanned = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _onDetect(BarcodeCapture capture) {
    if (_isScanned) return;
    final List<Barcode> barcodes = capture.barcodes;
    for (final barcode in barcodes) {
      final code = barcode.rawValue;
      if (code != null && code.isNotEmpty) {
        setState(() => _isScanned = true);
        Navigator.of(context).pop(code);
        break;
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        elevation: 0,
        title: const Text(
          'Escanear Código de SKU',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.flash_on, color: Colors.white),
            onPressed: () => _controller.toggleTorch(),
          ),
          IconButton(
            icon: const Icon(Icons.cameraswitch, color: Colors.white),
            onPressed: () => _controller.switchCamera(),
          ),
        ],
      ),
      body: Stack(
        alignment: Alignment.center,
        children: [
          MobileScanner(
            controller: _controller,
            onDetect: _onDetect,
          ),
          // Marco visor de escaneo
          Container(
            decoration: ShapeDecoration(
              shape: _ScannerOverlayShape(
                borderColor: AppColors.optimalGreen,
                borderRadius: 12,
                borderLength: 32,
                borderWidth: 4,
                cutOutSize: 260,
              ),
            ),
          ),
          Positioned(
            bottom: 40,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.7),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Text(
                'Alinee el código de barras o QR dentro del recuadro',
                style: TextStyle(color: Colors.white, fontSize: 13),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ScannerOverlayShape extends ShapeBorder {
  final Color borderColor;
  final double borderWidth;
  final Color overlayColor;
  final double borderRadius;
  final double borderLength;
  final double cutOutSize;

  const _ScannerOverlayShape({
    this.borderColor = Colors.white,
    this.borderWidth = 3.0,
    this.overlayColor = const Color(0x88000000),
    this.borderRadius = 0,
    this.borderLength = 40,
    this.cutOutSize = 250,
  });

  @override
  EdgeInsetsGeometry get dimensions => EdgeInsets.zero;

  @override
  Path getInnerPath(Rect rect, {TextDirection? textDirection}) {
    return Path()
      ..fillType = PathFillType.evenOdd
      ..addPath(getOuterPath(rect), Offset.zero);
  }

  @override
  Path getOuterPath(Rect rect, {TextDirection? textDirection}) {
    final Path path = Path()..addRect(rect);
    final double left = (rect.width - cutOutSize) / 2;
    final double top = (rect.height - cutOutSize) / 2;
    final Rect cutOutRect = Rect.fromLTWH(left, top, cutOutSize, cutOutSize);
    return Path.combine(
      PathOperation.difference,
      path,
      Path()..addRRect(RRect.fromRectAndRadius(cutOutRect, Radius.circular(borderRadius))),
    );
  }

  @override
  void paint(Canvas canvas, Rect rect, {TextDirection? textDirection}) {
    final Paint overlayPaint = Paint()..color = overlayColor;
    canvas.drawPath(getOuterPath(rect), overlayPaint);

    final Paint borderPaint = Paint()
      ..color = borderColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = borderWidth;

    final double left = (rect.width - cutOutSize) / 2;
    final double top = (rect.height - cutOutSize) / 2;

    // Esquinas
    canvas.drawLine(Offset(left, top + borderLength), Offset(left, top), borderPaint);
    canvas.drawLine(Offset(left, top), Offset(left + borderLength, top), borderPaint);

    canvas.drawLine(Offset(left + cutOutSize - borderLength, top), Offset(left + cutOutSize, top), borderPaint);
    canvas.drawLine(Offset(left + cutOutSize, top), Offset(left + cutOutSize, top + borderLength), borderPaint);

    canvas.drawLine(Offset(left, top + cutOutSize - borderLength), Offset(left, top + cutOutSize), borderPaint);
    canvas.drawLine(Offset(left, top + cutOutSize), Offset(left + borderLength, top + cutOutSize), borderPaint);

    canvas.drawLine(Offset(left + cutOutSize - borderLength, top + cutOutSize), Offset(left + cutOutSize, top + cutOutSize), borderPaint);
    canvas.drawLine(Offset(left + cutOutSize, top + cutOutSize), Offset(left + cutOutSize, top + cutOutSize - borderLength), borderPaint);
  }

  @override
  ShapeBorder scale(double t) => this;
}
