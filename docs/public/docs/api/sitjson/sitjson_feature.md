# sitJSON Feature

## Properties

- **`type`** *(string, required)*: Must be one of: `["Feature"]`.
- **`id`**
  - **One of**
    - *number*
    - *string*
- **`properties`**
  - **One of**
    - *null*
    - : Refer to *[./sitjson_amenity](../../api/sitjson/sitjson_amenity.md)*.
    - : Refer to *[./sitjson_utility](../../api/sitjson/sitjson_utility.md)*.
    - : Refer to *[./sitjson_landuse](../../api/sitjson/sitjson_landuse.md)*.
    - : Refer to *[./sitjson_pathway](../../api/sitjson/sitjson_pathway.md)*.
    - : Refer to *[./sitjson_door](../../api/sitjson/sitjson_door.md)*.
    - : Refer to *[./sitjson_highway](../../api/sitjson/sitjson_highway.md)*.
    - : Refer to *[./sitjson_wall](../../api/sitjson/sitjson_wall.md)*.
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
