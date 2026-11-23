# SportStockAI — Mobile App (Flutter)

Aplicación móvil nativa orientada al **Encargado de Tienda** para control de stock crítico, semáforo de disponibilidad y confirmación de conteos en rack con escáner de código de barras.

## Estructura del Proyecto (Clean Architecture)
```
mobile/
├── lib/
│   ├── core/
│   │   ├── constants/app_colors.dart
│   │   └── network/api_client.dart
│   ├── features/
│   │   └── inventory/
│   │       ├── data/
│   │       ├── domain/models/store_item.dart
│   │       └── presentation/
│   │           ├── screens/store_home_screen.dart
│   │           └── widgets/
│   └── main.dart
└── pubspec.yaml
```

## Ejecución
```bash
cd mobile
flutter pub get
flutter run
```
