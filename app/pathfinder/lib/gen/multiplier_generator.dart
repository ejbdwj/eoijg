import 'package:analyzer/dart/element/element.dart';
import 'package:build/build.dart';
import 'package:source_gen/source_gen.dart';

class Multiplier {
  final num value;

  const Multiplier(this.value);
}
class MultiplierGenerator extends GeneratorForAnnotation<Multiplier> {
  @override
  String generateForAnnotatedElement(
    Element element,
    ConstantReader annotation,
    BuildStep buildStep,
  ) {
    final numValue = annotation.read('value').literalValue as num;

    return 'num ${element.name}Multiplied() => ${element.name} * $numValue;';
  }
}