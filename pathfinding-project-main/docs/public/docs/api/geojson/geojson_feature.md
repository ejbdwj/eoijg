# GeoJSON Feature

## Properties

- **`type`** *(string, required)*: Must be one of: `["Feature"]`.
- **`id`**
  - **One of**
    - *number*
    - *string*
- **`properties`**
  - **One of**
    - *null*
    - *object*
- **`geometry`**
  - **One of**
    - *null*
    - : Refer to *[./geojson_point](../../api/geojson/geojson_point.md)*.
    - : Refer to *[./geojson_linestring](../../api/geojson/geojson_linestring.md)*.
    - : Refer to *[./geojson_polygon](../../api/geojson/geojson_polygon.md)*.
    - : Refer to *[./geojson_multipoint](../../api/geojson/geojson_multipoint.md)*.
    - : Refer to *[./geojson_multilinestring](../../api/geojson/geojson_multilinestring.md)*.
    - : Refer to *[./geojson_multipolygon](../../api/geojson/geojson_multipolygon.md)*.
    - : Refer to *[./geojson_geometrycollection](../../api/geojson/geojson_geometrycollection.md)*.
- **`bbox`** *(array)*: Length must be at least 4.
  - **Items** *(number)*
