import 'package:flutter/material.dart';
import 'package:flutter_debug_overlay/flutter_debug_overlay.dart';

class ExampleDebug extends StatefulWidget {
  const ExampleDebug({
    super.key,
  });
  @override
  State<ExampleDebug> createState() => _ExampleDebugState();
}
const allNonSingletonAmenities = ["arts", "cca", "classroom", "control_room", "events_venue", "server_room", "lab", "lab_prep", "lobby", "ict_helpdesk", "sports", "storage", "study_corner", "toilets"];
const allSingletonAmenities = ["bench", "bookshop", "canteen", "concourse", "counselling", "grandstand", "library", "lounge", "office", "shower", "sick_bay", "staff", "unk", "pizza_parlour"];
const amenityIcons = {
  "arts": Icons.palette,
  "cca": Icons.sports_basketball,
  "classroom": Icons.school,
  "control_room": Icons.repeat,
  "events_venue": Icons.theater_comedy,
  "server_room": Icons.dns,
  "lab": Icons.science,
  "lab_prep": Icons.biotech,
  "lobby": Icons.door_sliding,
  "ict_helpdesk": Icons.contact_support,
  "sports": Icons.sports_tennis,
  "storage": Icons.shelves,
  "study_corner": Icons.library_books,
  "toilets": Icons.wc,
  "bench": Icons.event_seat,
  "bookshop": Icons.menu_book,
  "canteen": Icons.restaurant,
  "concourse": Icons.pie_chart,
  "counselling": Icons.health_and_safety,
  "grandstand": Icons.groups,
  "library": Icons.local_library,
  "lounge": Icons.chair,
  "office": Icons.local_post_office,
  "shower": Icons.shower,
  "sick_bay": Icons.vaccines,
  "staff": Icons.supervised_user_circle,
  "unk": Icons.verified,
  "pizza_parlour": Icons.local_pizza
};
Set<int> selectedLevel = {1};
Set<String> selectedNonSingletonAmenities = allNonSingletonAmenities.toSet();
Set<String> selectedSingletonAmenities = allSingletonAmenities.toSet();

class _ExampleDebugState extends State<ExampleDebug> {
  @override
  Widget build(BuildContext context) {
    return DebugEntry(
      title: const Text("Example"),
      child: Column(
        children: [
          ListTile(
            title: Text("Display Level", style: Theme.of(context).textTheme.titleMedium),
            trailing:  SegmentedButton<int>(
              selected: selectedLevel,
              onSelectionChanged: (Set<int> newSelection) {setState(() {selectedLevel = newSelection;});},
              segments: const [1, 2, 3, 4, 5, 6].map((elm)=>ButtonSegment(value: elm, label: Text(elm.toString()))).toList()
            ),
          ),
          ListTile(
            title: Text("Display Amenity", style: Theme.of(context).textTheme.titleMedium),
            trailing:  SegmentedButton<String>(
              multiSelectionEnabled: true,
              emptySelectionAllowed: true,
              selected: selectedNonSingletonAmenities,
              onSelectionChanged: (Set<String> newSelection) {setState(() {selectedNonSingletonAmenities = newSelection;print(selectedNonSingletonAmenities);});},
              segments: allNonSingletonAmenities.map((elm)=>ButtonSegment(value: elm, tooltip: elm, icon: Icon(amenityIcons[elm]))).toList(),
            ),
          ),
          ListTile(
            title: Text("               ", style: Theme.of(context).textTheme.titleMedium),
            trailing:  SegmentedButton<String>(
              multiSelectionEnabled: true,
              emptySelectionAllowed: true,
              selected: selectedSingletonAmenities,
              onSelectionChanged: (Set<String> newSelection) {setState(() {selectedSingletonAmenities = newSelection;});},
              segments: allSingletonAmenities.map((elm)=>ButtonSegment(value: elm, tooltip: elm, icon: Icon(amenityIcons[elm]))).toList(),
            ),
          ),
        ],
      ),
    );
  }
}