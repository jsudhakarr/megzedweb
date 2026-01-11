# Action Form Integration Summary

## API URLs
- **Load category fields**: `GET https://api.megzed.com/api/v1/categories/{categoryId}/form-fields`
  - Response shape: `{ success: true, data: { category_id, fields: [...] } }`
- **Submit item action**: `POST https://api.megzed.com/api/v1/items/{itemId}/action-submit`
  - JSON payload (no files):
    ```json
    {
      "action_code": "book_stay",
      "values": {
        "78": "2026-01-11",
        "80": "3"
      }
    }
    ```
  - Multipart payload (file included):
    ```
    action_code=book_stay
    values[78]=2026-01-11
    values[80]=3
    values[85]=<file>
    ```

## Payload rules
- Always include `action_code` and `values`.
- Use JSON when no file is present.
- Use multipart/form-data when any field value is a `File`.

## Adding new field types
1. Add the new type name to `src/types/actionForm.ts` (`ActionFieldType`).
2. Create a renderer component in `src/components/actionForm/fields/` or reuse an existing one.
3. Wire the new type in `src/components/actionForm/ActionFormRenderer.tsx` by adding a case in the `type` switch.
4. If the new field needs special submit formatting, extend `formatValueForSubmit` in `ActionFormRenderer.tsx`.
