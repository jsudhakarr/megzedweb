# Home Sections Mapping

This document maps `front-web/sections` configuration to the public API endpoints used by the front-web Home resolver.

## Section Type → Endpoint

| section.type | data_source.filter | Endpoint | Notes |
| --- | --- | --- | --- |
| `slider` | _n/a_ | `GET /api/v1/sliders` | `item_count` is applied as `per_page` when supported, otherwise results are sliced. |
| `categories` | _n/a_ | `GET /api/v1/categories` | Uses existing public categories endpoint. |
| `items` | `featured` | `GET /api/v1/items/featured` | Applies `item_count`. |
| `items` | `most_viewed` | `GET /api/v1/items/most-viewed` | Applies `item_count`. |
| `items` | `most_favorited` | `GET /api/v1/items/most-favorited` | Applies `item_count`. |
| `items` | `most_liked` | `GET /api/v1/items/most-liked` | Applies `item_count`. |
| `items` | `category` | `GET /api/v1/items/by-category/{source_id}` | Uses `data_source.source_id`. |
| `items` | _default_ | `GET /api/v1/items` | Applies `item_count`. |
| `shops` | `verified` | `GET /api/v1/shops/verified` | Applies `item_count`. |
| `shops` | `top_rated` | `GET /api/v1/shops/top-rated` | Applies `item_count`. |
| `shops` | _default_ | `GET /api/v1/shops` | Applies `item_count`. |
| `users` | `highlights` | `GET /api/v1/users/highlights` | Applies `item_count` by slicing. |
| `users` | `verified` | `GET /api/v1/users/public/verified` | Applies `item_count` by slicing. |
| `users` | `top_rated` | `GET /api/v1/users/public/top-rated` | Applies `item_count` by slicing. |
| `users` | _default_ | `GET /api/v1/users/public` | Applies `item_count`. |
| `ad` | _n/a_ | _no API call_ | Uses `section.ad_config`. |

## Resolved Data Keys

The resolver attaches a `resolvedData` object to each section with the following keys:

- `slides` (slider)
- `categories` (categories)
- `items` (items)
- `shops` (shops)
- `users` (users)
- `ad` (ad config)
