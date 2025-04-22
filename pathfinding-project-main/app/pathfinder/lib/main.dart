// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import 'dart:io';

import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:location/location.dart';
import 'package:maplibre_gl/maplibre_gl.dart';
import 'package:flutter_debug_overlay/flutter_debug_overlay.dart';
import 'package:pathfinder/map/debug_model.dart';
import 'package:provider/provider.dart';

import 'map/attribution.dart';
import 'map/get_map_informations.dart';
import 'map/given_bounds.dart';
import 'map/localized_map.dart';
import 'map/no_location_permission_page.dart';
import 'map/animate_camera.dart';
import 'map/annotation_order_maps.dart';
import 'map/click_annotations.dart';
import 'map/custom_marker.dart';
import 'full_map.dart';
import 'map/layer.dart';
import 'map/line.dart';
import 'map/local_style.dart';
import 'map/map_ui.dart';
import 'map/move_camera.dart';
import 'map/offline_regions.dart';
import 'map/page.dart';
import 'map/place_batch.dart';
import 'map/place_circle.dart';
import 'map/place_fill.dart';
import 'map/place_source.dart';
import 'map/place_symbol.dart';
import 'map/scrolling_map.dart';
import 'map/sources.dart';
import 'debug_widget.dart';

final List<ExamplePage> _allPages = <ExamplePage>[
  const MapUiPage(),
  const FullMapPage(),
  const LocalizedMapPage(),
  const AnimateCameraPage(),
  const MoveCameraPage(),
  const PlaceSymbolPage(),
  const PlaceSourcePage(),
  const LinePage(),
  const LocalStylePage(),
  const LayerPage(),
  const PlaceCirclePage(),
  const PlaceFillPage(),
  const ScrollingMapPage(),
  const OfflineRegionsPage(),
  const AnnotationOrderPage(),
  const CustomMarkerPage(),
  const BatchAddPage(),
  const ClickAnnotationPage(),
  const Sources(),
  const GivenBoundsPage(),
  const GetMapInfoPage(),
  const NoLocationPermissionPage(),
  const AttributionPage(),
];

class MapsDemo extends StatefulWidget {
  const MapsDemo({super.key});

  @override
  State<MapsDemo> createState() => _MapsDemoState();
}

class _MapsDemoState extends State<MapsDemo> {
  /// Determine the android version of the phone and turn off HybridComposition
  /// on older sdk versions to improve performance for these
  ///
  /// !!! Hybrid composition is currently broken do no use !!!
  Future<void> initHybridComposition() async {
    if (!kIsWeb && Platform.isAndroid) {
      final androidInfo = await DeviceInfoPlugin().androidInfo;
      final sdkVersion = androidInfo.version.sdkInt;
      if (sdkVersion >= 29) {
        MapLibreMap.useHybridComposition = true;
      } else {
        MapLibreMap.useHybridComposition = false;
      }
    }
  }

  Future<void> _pushPage(BuildContext context, ExamplePage page) async {
    if (!kIsWeb && page.needsLocationPermission) {
      final location = Location();
      final hasPermissions = await location.hasPermission();
      if (hasPermissions != PermissionStatus.granted) {
        await location.requestPermission();
      }
    }
    if (context.mounted) {
      Navigator.of(context).push(MaterialPageRoute<void>(
        builder: (_) => Scaffold(
          appBar: AppBar(title: Text(page.title)),
          body: page,
        ),
      ));
    }
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        Provider(create: (context) => DebugModel()),
      ],
      child: Scaffold(
        appBar: AppBar(title: const Text('MapLibre examples')),
        body: ListView.builder(
          itemCount: _allPages.length + 1,
          itemBuilder: (_, int index) => index == _allPages.length
              ? const AboutListTile(
                  applicationName: "flutter-maplibre-gl example",
                )
              : ListTile(
                  leading: _allPages[index].leading,
                  title: Text(_allPages[index].title),
                  onTap: () => _pushPage(context, _allPages[index]),
                ),
        ),
      ),
    );
  }
}

void main() {
  var app = MaterialApp(
      home: const MapsDemo(),
      builder: (context, child) {
        return DebugOverlay(
          hiddenFields: const [HttpHeaders.authorizationHeader, "Token"],
          debugEntries: const [ExampleDebug()],
          child: child ?? const SizedBox.shrink(),
        );
      });
  runApp(app);
}
//main.dart
// import 'package:flutter/material.dart';

// import 'src/app.dart';
// import 'src/settings/settings_controller.dart';
// import 'src/settings/settings_service.dart';

// void main() async {
//   // Set up the SettingsController, which will glue user settings to multiple
//   // Flutter Widgets.
//   final settingsController = SettingsController(SettingsService());

//   // Load the user's preferred theme while the splash screen is displayed.
//   // This prevents a sudden theme change when the app is first displayed.
//   await settingsController.loadSettings();

//   // Run the app and pass in the SettingsController. The app listens to the
//   // SettingsController for changes, then passes it further down to the
//   // SettingsView.
//   runApp(MyApp(settingsController: settingsController));
// }

//index.html
// <!DOCTYPE html>
// <html>
// <head>
//   <!--
//     If you are serving your web app in a path other than the root, change the
//     href value below to reflect the base path you are serving from.

//     The path provided below has to start and end with a slash "/" in order for
//     it to work correctly.

//     For more details:
//     * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/base

//     This is a placeholder for base href that will be replaced by the value of
//     the `--base-href` argument provided to `flutter build`.
//   -->
//   <script src='https://unpkg.com/maplibre-gl@^4.3/dist/maplibre-gl.js'></script>
//   <link href='https://unpkg.com/maplibre-gl@^4.3/dist/maplibre-gl.css'
//         rel='stylesheet'/>
//   <base href="$FLUTTER_BASE_HREF">

//   <meta charset="UTF-8">
//   <meta content="IE=Edge" http-equiv="X-UA-Compatible">
//   <meta name="description" content="A new Flutter project.">

//   <!-- iOS meta tags & icons -->
//   <meta name="apple-mobile-web-app-capable" content="yes">
//   <meta name="apple-mobile-web-app-status-bar-style" content="black">
//   <meta name="apple-mobile-web-app-title" content="pathfinder">
//   <link rel="apple-touch-icon" href="icons/Icon-192.png">

//   <!-- Favicon -->
//   <link rel="icon" type="image/png" href="favicon.png"/>

//   <title>pathfinder</title>
//   <link rel="manifest" href="manifest.json">
// </head>
// <body>
//   <script src="flutter_bootstrap.js" async></script>
// </body>
// </html>
