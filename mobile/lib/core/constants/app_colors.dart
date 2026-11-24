import 'package:flutter/material.dart';

class AppPalette {
  final Color background;
  final Color surface;
  final Color border;
  final Color criticalRed;
  final Color criticalRedBg;
  final Color warningAmber;
  final Color warningAmberBg;
  final Color optimalGreen;
  final Color optimalGreenBg;
  final Color accentForeground;
  final Color textPrimary;
  final Color textSecondary;
  final Color textMuted;

  const AppPalette({
    required this.background,
    required this.surface,
    required this.border,
    required this.criticalRed,
    required this.criticalRedBg,
    required this.warningAmber,
    required this.warningAmberBg,
    required this.optimalGreen,
    required this.optimalGreenBg,
    required this.accentForeground,
    required this.textPrimary,
    required this.textSecondary,
    required this.textMuted,
  });

  static const AppPalette light = AppPalette(
    background: Color(0xFFF4F7FB),
    surface: Color(0xFFFFFFFF),
    border: Color(0xFFE2E8F0),
    criticalRed: Color(0xFFB91C1C),
    criticalRedBg: Color(0xFFFEF2F2),
    warningAmber: Color(0xFFB45309),
    warningAmberBg: Color(0xFFFFFBEB),
    optimalGreen: Color(0xFF059669),
    optimalGreenBg: Color(0xFFECFDF5),
    accentForeground: Color(0xFFFFFFFF),
    textPrimary: Color(0xFF0F172A),
    textSecondary: Color(0xFF334155),
    textMuted: Color(0xFF64748B),
  );

  static const AppPalette dark = AppPalette(
    background: Color(0xFF0B0F19),
    surface: Color(0xFF111827),
    border: Color(0xFF1F2937),
    criticalRed: Color(0xFFEF4444),
    criticalRedBg: Color(0xFF450A0A),
    warningAmber: Color(0xFFF59E0B),
    warningAmberBg: Color(0xFF451A03),
    optimalGreen: Color(0xFF10B981),
    optimalGreenBg: Color(0xFF064E3B),
    accentForeground: Color(0xFF042F22),
    textPrimary: Color(0xFFF9FAFB),
    textSecondary: Color(0xFF9CA3AF),
    textMuted: Color(0xFF64748B),
  );
}

class AppColors {
  // Constantes legadas (compatibilidad con pantallas de cámara / modo oscuro)
  static const Color background = Color(0xFF0B0F19);
  static const Color surface = Color(0xFF111827);
  static const Color border = Color(0xFF1F2937);

  static const Color criticalRed = Color(0xFFEF4444);
  static const Color criticalRedBg = Color(0xFF450A0A);

  static const Color warningAmber = Color(0xFFF59E0B);
  static const Color warningAmberBg = Color(0xFF451A03);

  static const Color optimalGreen = Color(0xFF10B981);
  static const Color optimalGreenBg = Color(0xFF064E3B);

  static const Color textPrimary = Color(0xFFF9FAFB);
  static const Color textSecondary = Color(0xFF9CA3AF);
  static const Color textMuted = Color(0xFF64748B);

  static AppPalette of(BuildContext context) {
    return Theme.of(context).brightness == Brightness.dark
        ? AppPalette.dark
        : AppPalette.light;
  }
}
