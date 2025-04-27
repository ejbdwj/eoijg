import 'dart:collection';

import 'package:flutter/material.dart';

class DebugModel extends ChangeNotifier {
  final List<int> _level = [];

  UnmodifiableListView<int> get items => UnmodifiableListView(_level);

  void add(int l) {
    _level.add(l);
    notifyListeners();
  }

  /// Removes all items from the cart.
  void removeAll() {
    _level.clear();
    notifyListeners();
  }
}