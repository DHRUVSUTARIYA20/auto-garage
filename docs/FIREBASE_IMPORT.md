# Firestore Data Import

Use this to import all exported table data (CSV/JSON) into Firebase Firestore collections.

## Prerequisites

1. Configure Firebase Admin credentials in `.env.local`:

```env
FIREBASE_SERVICE_ACCOUNT_PATH=./service-account.json
FIREBASE_PROJECT_ID=auto-7e7ce
```

2. Export your source tables as CSV or JSON.
3. Put files in `scripts/data/`.

Example file names:

- `scripts/data/bookings.csv`
- `scripts/data/garage_staff.csv`
- `scripts/data/garages.csv`
- `scripts/data/inventory.csv`
- `scripts/data/profiles.csv`
- `scripts/data/services.csv`
- `scripts/data/staff.csv`
- `scripts/data/tasks.csv`
- `scripts/data/time_logs.csv`
- `scripts/data/users.csv`

Collection name is taken from filename (without extension).

## Commands

Dry run (no writes):

```bash
npm run import:firestore:dry
```

Import all files in `scripts/data`:

```bash
npm run import:firestore
```

Import specific collections:

```bash
npm run import:firestore -- --collections garages,profiles,bookings
```

Replace existing collection docs before import:

```bash
npm run import:firestore -- --replace
```

Use custom data directory:

```bash
npm run import:firestore -- --dir ./my-export-folder
```

## Notes

- If a row has an `id` column, it is used as Firestore document id.
- Empty strings are converted to `null`.
- `"true"`/`"false"` become booleans.
- Numeric strings become numbers.
- JSON-like values (`{...}` or `[...]`) are parsed into objects/arrays.
- Firestore writes use batch operations.
