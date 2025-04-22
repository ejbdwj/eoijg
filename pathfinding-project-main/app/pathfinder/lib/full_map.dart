import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:maplibre_gl/maplibre_gl.dart';
import "dart:convert";
import 'map/page.dart';
import 'debug_widget.dart';

class FullMapPage extends ExamplePage {
  const FullMapPage({super.key})
      : super(const Icon(Icons.map), 'Full screen map');

  @override
  Widget build(BuildContext context) {
    return const FullMap();
  }
}

class FullMap extends StatefulWidget {
  const FullMap({super.key});

  @override
  State createState() => FullMapState();
}

class FullMapState extends State<FullMap> {
  MapLibreMapController? mapController;
  List<String>? amenityList;
  List<String>? utilityList;
  var currentLevel = selectedLevel.first.toString();
  var selectedAmenities = allNonSingletonAmenities.toList()+allSingletonAmenities.toList();
  _onMapCreated(MapLibreMapController controller) {
    mapController = controller;
  }

  void _onStyleLoadedCallback() async {
    String data = await rootBundle.loadString("data/josm/main.geojson");
    amenityList = ["arts", "bench", "bookshop", "canteen", "cca", "classroom", "concourse", "control_room", "counselling", "events_venue", "grandstand", "ict_helpdesk", "server_room", "lab", "lab_prep", "library", "lobby", "lounge", "office", "shower", "sick_bay", "sports", "staff", "storage", "study_corner", "toilets", "unk", "pizza_parlour"];
    utilityList = ["ac_ledge", "air_handling_unit", "coaxial_distribution_room", "electrical_riser", "hose_riser", "service_duct", "switch_room", "telecom_equipment_room", "water_supply_main", "pump_room", "lan_riser"];
    await mapController?.addSource(
      "base",
      GeojsonSourceProperties(data: json.decode(data))
    );    
    await mapController?.setCameraBounds(west: 0.0685+103.7, north: 1.3055, south: 1.3080, east: 0.0710+103.7, padding: 0);

    for (var name in amenityList!) {
      await mapController?.addFillExtrusionLayer("base", "amenity_$name", const FillExtrusionLayerProperties(
          fillExtrusionColor: "#0000ff",
          fillExtrusionHeight: 10,
          fillExtrusionBase: 0,
          fillExtrusionOpacity: 0.5
        ),
        filter: ['all', ['==', "level", currentLevel], ['any', ["==", "amenity", name]]]
      );
    }
    for (var name in utilityList!) {
      await mapController?.addFillExtrusionLayer("base", "utility_$name", const FillExtrusionLayerProperties(
          fillExtrusionColor: "#ff0000",
          fillExtrusionHeight: 10,
          fillExtrusionBase: 0,
          fillExtrusionOpacity: 0.5
        ),
        filter: ['all', ['==', "level", currentLevel], ['any', ["==", "utility", name]]]
      );
    }
    await mapController?.addFillLayer("base", "paths", const FillLayerProperties(
        fillColor: "#aaaaaa",
        fillOpacity: 0.5
      ),
      filter: ['all', ['==', "level", currentLevel], ['any', ["==", "indoor", "corridor"]]]
    );
    await mapController?.addFillLayer("base", "grass", const FillLayerProperties(
        fillColor: "#55ff55",
        fillOpacity: 0.5
      ),
      filter: ['all', ['==', "level", currentLevel], ['any', ["==", "landuse", "grass"], ["==", "landuse", "garden"]]]
    );
    await mapController?.addFillLayer("base", "void_deck", const FillLayerProperties(
        fillColor: "#ffaaaa",
        fillOpacity: 0.5
      ),
      filter: ['all', ['==', "level", currentLevel], ['any', ["==", "landuse", "void_deck"]]]
    );
    await mapController?.addFillLayer("base", "water", const FillLayerProperties(
        fillColor: "#77aaff",
        fillOpacity: 0.5
      ),
      filter: ['all', ['==', "level", currentLevel], ['any', ["==", "landuse", "water_feature"]]]
    );
  }

  @override
  Widget build(BuildContext context) {
    var temp = Scaffold(
        body: MapLibreMap(
          onMapCreated: _onMapCreated,
          initialCameraPosition: const CameraPosition(target: LatLng(0.0, 0.0)),
          onStyleLoadedCallback: _onStyleLoadedCallback,
          onMapClick: (point, coordinates) => {
            for (var name in amenityList!) {
              mapController?.setFilter("amenity_$name", ['all', ['==', "level", currentLevel], ['any', ["==", "amenity", name]]])
              .then((value)=> {
                setState(() {
                  currentLevel = selectedLevel.first.toString();
                })
              }),
              mapController?.setLayerProperties("amenity_$name", FillExtrusionLayerProperties.fromJson({"visible": selectedAmenities.contains(name)}))
              .then((value)=> {
                setState(() {
                  selectedAmenities = allNonSingletonAmenities.toList()+allSingletonAmenities.toList();
                  print(allNonSingletonAmenities);
                })
              })
            },
            for (var name in utilityList!) {
              mapController?.setFilter("utility_$name", ['all', ['==', "level", currentLevel], ['any', ["==", "utility", name]]])
              .then((value)=> {
                setState(() {
                  currentLevel = selectedLevel.first.toString();
                })
              })
            },
            
            mapController?.setFilter("paths", ['all', ['==', "level", currentLevel], ['any', ["==", "indoor", "corridor"]]])
            .then((value)=> {
              setState(() {
                currentLevel = selectedLevel.first.toString();
              })
            }),
            mapController?.setFilter("grass", ['all', ['==', "level", currentLevel], ['any', ["==", "landuse", "grass"], ["==", "landuse", "garden"]]])
            .then((value)=> {
              setState(() {
                currentLevel = selectedLevel.first.toString();
              })
            }),
            mapController?.setFilter("void_deck", ['all', ['==', "level", currentLevel], ['any', ["==", "landuse", "void_deck"]]])
            .then((value)=> {
              setState(() {
                currentLevel = selectedLevel.first.toString();
              })
            }),
            mapController?.setFilter("water", ['all', ['==', "level", currentLevel], ['any', ["==", "landuse", "water_feature"]]])
            .then((value)=> {
              setState(() {
                currentLevel = selectedLevel.first.toString();
              })
            })
          },
        ),
      );
      return temp;
  }
  
}
