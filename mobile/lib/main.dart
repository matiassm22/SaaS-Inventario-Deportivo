import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'core/constants/app_colors.dart';
import 'features/inventory/presentation/screens/store_home_screen.dart';

final ValueNotifier<ThemeMode> appThemeMode = ValueNotifier<ThemeMode>(ThemeMode.dark);

void toggleAppThemeMode(BuildContext context) {
  final isCurrentlyDark = Theme.of(context).brightness == Brightness.dark;
  appThemeMode.value = isCurrentlyDark ? ThemeMode.light : ThemeMode.dark;
}

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const SportStockMobileApp());
}

class SportStockMobileApp extends StatelessWidget {
  const SportStockMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<ThemeMode>(
      valueListenable: appThemeMode,
      builder: (context, mode, _) {
        final isDark = mode == ThemeMode.dark;
        SystemChrome.setSystemUIOverlayStyle(
          SystemUiOverlayStyle(
            statusBarColor: Colors.transparent,
            statusBarIconBrightness: isDark ? Brightness.light : Brightness.dark,
            statusBarBrightness: isDark ? Brightness.dark : Brightness.light,
          ),
        );

        return MaterialApp(
          title: 'SportStock Tienda',
          debugShowCheckedModeBanner: false,
          themeMode: mode,
          theme: ThemeData(
            brightness: Brightness.light,
            scaffoldBackgroundColor: AppPalette.light.background,
            colorScheme: ColorScheme.light(
              primary: AppPalette.light.optimalGreen,
              surface: AppPalette.light.surface,
              onSurface: AppPalette.light.textPrimary,
            ),
            appBarTheme: AppBarTheme(
              backgroundColor: AppPalette.light.background,
              foregroundColor: AppPalette.light.textPrimary,
              elevation: 0,
            ),
            fontFamily: 'Roboto',
          ),
          darkTheme: ThemeData(
            brightness: Brightness.dark,
            scaffoldBackgroundColor: AppPalette.dark.background,
            colorScheme: ColorScheme.dark(
              primary: AppPalette.dark.optimalGreen,
              surface: AppPalette.dark.surface,
              onSurface: AppPalette.dark.textPrimary,
            ),
            appBarTheme: AppBarTheme(
              backgroundColor: AppPalette.dark.background,
              foregroundColor: AppPalette.dark.textPrimary,
              elevation: 0,
            ),
            fontFamily: 'Roboto',
          ),
          home: const StoreHomeScreen(),
        );
      },
    );
  }
}
