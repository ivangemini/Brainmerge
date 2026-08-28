# Data File Rules

- Data files must parse successfully and use consistent naming/key conventions.
- Prefer lowercase filenames and camelCase object keys unless a format/library requires otherwise.
- Gameplay content should be data-driven where it improves iteration and balancing.
- Breaking save/content schema changes require a version and migration/compatibility plan.
- Important numeric tuning values need a named field and enough nearby documentation to understand their purpose.
- Do not require a separate JSON Schema for every tiny file; add schemas/validators where data complexity or failure risk justifies them.
- Avoid orphaned content entries.