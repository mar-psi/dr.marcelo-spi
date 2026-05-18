import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import pg from "pg";

const ENV_FILES = [".env.local", ".env"];

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;

  const raw = readFileSync(filePath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    if (!key || process.env[key]) continue;

    let value = trimmed.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value.replaceAll("\\n", "\n");
  }
}

for (const file of ENV_FILES) {
  loadEnvFile(resolve(process.cwd(), file));
}

const sqlFile = process.argv[2];

if (!sqlFile) {
  console.error("Uso: pnpm db:apply <arquivo.sql>");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL ausente em .env.local ou .env.");
  process.exit(1);
}

const sqlPath = resolve(process.cwd(), sqlFile);
const sql = readFileSync(sqlPath, "utf8");
const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(sql);
  console.log(`SQL aplicado com sucesso: ${sqlFile}`);
} finally {
  await client.end();
}
