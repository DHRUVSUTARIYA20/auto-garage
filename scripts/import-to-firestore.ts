import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { adminDb } from "../server/lib/firebase-admin";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config();

type ParsedArgs = {
  dir: string;
  collections: string[] | null;
  replace: boolean;
  dryRun: boolean;
  batchSize: number;
};

const parseArgs = (): ParsedArgs => {
  const args = process.argv.slice(2);
  const out: ParsedArgs = {
    dir: path.join(process.cwd(), "scripts", "data"),
    collections: null,
    replace: false,
    dryRun: false,
    batchSize: 400,
  };

  for (let i = 0; i < args.length; i += 1) {
    const token = args[i];
    if (token === "--dir" && args[i + 1]) {
      out.dir = path.resolve(process.cwd(), args[i + 1]);
      i += 1;
      continue;
    }
    if (token === "--collections" && args[i + 1]) {
      out.collections = args[i + 1]
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      i += 1;
      continue;
    }
    if (token === "--replace") {
      out.replace = true;
      continue;
    }
    if (token === "--dry-run") {
      out.dryRun = true;
      continue;
    }
    if (token === "--batch-size" && args[i + 1]) {
      const parsed = Number(args[i + 1]);
      if (Number.isFinite(parsed) && parsed > 0 && parsed <= 500) {
        out.batchSize = Math.floor(parsed);
      }
      i += 1;
    }
  }

  return out;
};

const parseCsvLine = (line: string): string[] => {
  const output: string[] = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === "\"") {
      const isEscapedQuote = inQuotes && line[i + 1] === "\"";
      if (isEscapedQuote) {
        value += "\"";
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === "," && !inQuotes) {
      output.push(value);
      value = "";
      continue;
    }

    value += ch;
  }

  output.push(value);
  return output;
};

const parseCsv = (raw: string): Record<string, unknown>[] => {
  const rows = raw
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (rows.length === 0) return [];

  const headers = parseCsvLine(rows[0]).map((h) => h.trim());
  const dataRows = rows.slice(1);

  return dataRows.map((line) => {
    const columns = parseCsvLine(line);
    const record: Record<string, unknown> = {};

    headers.forEach((header, index) => {
      const value = columns[index] ?? "";
      record[header] = value;
    });

    return record;
  });
};

const normalizeValue = (input: unknown): unknown => {
  if (input == null) return null;
  if (typeof input !== "string") return input;

  const value = input.trim();
  if (value === "") return null;

  const lower = value.toLowerCase();
  if (lower === "null" || lower === "undefined") return null;
  if (lower === "true") return true;
  if (lower === "false") return false;

  if (
    (value.startsWith("{") && value.endsWith("}")) ||
    (value.startsWith("[") && value.endsWith("]"))
  ) {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  if (/^-?\d+(\.\d+)?$/.test(value)) {
    const num = Number(value);
    if (Number.isFinite(num)) return num;
  }

  return value;
};

const normalizeRow = (row: Record<string, unknown>) => {
  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    normalized[key] = normalizeValue(value);
  }
  return normalized;
};

const readRowsFromFile = (filePath: string): Record<string, unknown>[] => {
  const ext = path.extname(filePath).toLowerCase();
  const raw = fs.readFileSync(filePath, "utf8");

  if (ext === ".json") {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error(`JSON file must contain an array: ${filePath}`);
    }
    return parsed.map((row) => normalizeRow(row as Record<string, unknown>));
  }

  if (ext === ".csv") {
    return parseCsv(raw).map(normalizeRow);
  }

  throw new Error(`Unsupported file extension "${ext}" for ${filePath}`);
};

const deleteCollectionDocs = async (collectionName: string, batchSize: number) => {
  while (true) {
    const snap = await adminDb.collection(collectionName).limit(batchSize).get();
    if (snap.empty) return;

    const batch = adminDb.batch();
    snap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }
};

const writeRows = async (
  collectionName: string,
  rows: Record<string, unknown>[],
  batchSize: number
) => {
  let inserted = 0;

  for (let index = 0; index < rows.length; index += batchSize) {
    const chunk = rows.slice(index, index + batchSize);
    const batch = adminDb.batch();

    for (const rawRow of chunk) {
      const row = { ...rawRow };
      const id = String(row.id ?? "").trim();
      delete row.id;

      const ref = id ? adminDb.collection(collectionName).doc(id) : adminDb.collection(collectionName).doc();
      batch.set(ref, row, { merge: true });
      inserted += 1;
    }

    await batch.commit();
  }

  return inserted;
};

const run = async () => {
  const args = parseArgs();
  if (!fs.existsSync(args.dir)) {
    console.log(`Data directory not found: ${args.dir}`);
    console.log("Create it and add CSV/JSON files, then run the import again.");
    return;
  }

  const files = fs
    .readdirSync(args.dir)
    .filter((name) => /\.(csv|json)$/i.test(name))
    .sort((a, b) => a.localeCompare(b));

  if (files.length === 0) {
    console.log(`No CSV/JSON files found in ${args.dir}`);
    return;
  }

  const selectedFiles = args.collections
    ? files.filter((name) => args.collections?.includes(path.basename(name, path.extname(name))))
    : files;

  if (selectedFiles.length === 0) {
    console.log("No matching files for --collections filter.");
    return;
  }

  console.log(`Import directory: ${args.dir}`);
  console.log(`Mode: ${args.dryRun ? "dry-run" : "write"}`);
  console.log(`Replace existing: ${args.replace ? "yes" : "no"}`);
  console.log(`Batch size: ${args.batchSize}`);
  console.log("");

  for (const file of selectedFiles) {
    const filePath = path.join(args.dir, file);
    const collection = path.basename(file, path.extname(file));
    const rows = readRowsFromFile(filePath);

    console.log(`Collection: ${collection}`);
    console.log(`File: ${file}`);
    console.log(`Rows: ${rows.length}`);

    if (args.dryRun) {
      console.log("Action: skipped (dry-run)");
      console.log("");
      continue;
    }

    if (args.replace) {
      await deleteCollectionDocs(collection, args.batchSize);
      console.log("Action: existing docs cleared");
    }

    const inserted = await writeRows(collection, rows, args.batchSize);
    console.log(`Action: imported ${inserted} docs`);
    console.log("");
  }

  console.log("Import complete.");
};

run().catch((error) => {
  console.error("Import failed:", error);
  process.exit(1);
});
