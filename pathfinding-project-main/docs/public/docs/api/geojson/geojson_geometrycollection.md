# GeoJSON GeometryCollection

## Properties

- **`type`** *(string, required)*: Must be one of: `["GeometryCollection"]`.
- **`geometries`** *(array, required)*
  - **Items**
    - **One of**
      - : Refer to *[./geojson_point](../../api/geojson/geojson_point.md)*.
      - : Refer to *[./geojson_linestring](../../api/geojson/geojson_linestring.md)*.
      - : Refer to *[./geojson_polygon](../../api/geojson/geojson_polygon.md)*.
      - : Refer to *[./geojson_multipoint](../../api/geojson/geojson_multipoint.md)*.
      - : Refer to *[./geojson_multilinestring](../../api/geojson/geojson_multilinestring.md)*.
      - : Refer to *[./geojson_multipolygon](../../api/geojson/geojson_multipolygon.md)*.
- **`bbox`** *(array)*: Length must be at least 4.
  - **Items** *(number)*
