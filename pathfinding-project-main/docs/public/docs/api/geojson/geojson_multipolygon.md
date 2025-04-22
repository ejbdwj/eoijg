# GeoJSON MultiPolygon

## Properties

- **`type`** *(string, required)*: Must be one of: `["MultiPolygon"]`.
- **`coordinates`** *(array, required)*
  - **Items** *(array)*
    - **Items** *(array)*: Length must be at least 4.
      - **Items** *(array)*: Length must be at least 2.
        - **Items** *(number)*
- **`bbox`** *(array)*: Length must be at least 4.
  - **Items** *(number)*
