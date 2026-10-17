import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import pg from "pg";

export function localDatabaseUrl(value) {
  if (!value) throw new Error("DATABASE_URL_MISSING");
  let url;
  try { url = new URL(value); } catch { throw new Error("DATABASE_URL_INVALID"); }
  if (!["postgres:", "postgresql:"].includes(url.protocol) ||
      !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
      [...url.searchParams.keys()].some(key => ["host", "hostaddr", "port", "dbname", "service"].includes(key.toLowerCase()))) {
    throw new Error("DATABASE_MUST_BE_LOCAL");
  }
  return value;
}

export async function migrate(client, directory = fileURLToPath(new URL("../../local/migrations/", import.meta.url))) {
  const files = (await readdir(directory)).filter(name => /^\d{4}_[a-z0-9_]+\.sql$/.test(name)).sort();
  const applied = [];
  await client.query("BEGIN");
  try {
    await client.query("SELECT pg_advisory_xact_lock(19485001)");
    await client.query("CREATE SCHEMA IF NOT EXISTS swingpilot");
    await client.query("REVOKE ALL ON SCHEMA swingpilot FROM PUBLIC");
    await client.query(`CREATE TABLE IF NOT EXISTS swingpilot.schema_migrations (
      name text PRIMARY KEY, sha256 text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now()
    )`);
    await client.query("REVOKE ALL ON swingpilot.schema_migrations FROM PUBLIC");
    for (const name of files) {
      const sql = await readFile(`${directory}/${name}`, "utf8");
      const sha256 = createHash("sha256").update(sql).digest("hex");
      const prior = await client.query("SELECT sha256 FROM swingpilot.schema_migrations WHERE name=$1", [name]);
      if (prior.rowCount) {
        if (prior.rows[0].sha256 !== sha256) throw new Error("APPLIED_MIGRATION_CHANGED");
        continue;
      }
      await client.query(sql);
      await client.query("INSERT INTO swingpilot.schema_migrations(name, sha256) VALUES ($1,$2)", [name, sha256]);
      applied.push(name);
    }
    await client.query("COMMIT");
    return applied;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let client;
  try {
    client = new pg.Client({ connectionString: localDatabaseUrl(process.env.DATABASE_URL), connectionTimeoutMillis: 5000 });
    await client.connect();
    const applied = await migrate(client);
    console.log(`Local schema ready. Applied ${applied.length} migration(s).`);
  } catch (error) {
    // Database errors/URLs may contain secrets or private inputs; show only safe codes.
    const safe = ["DATABASE_URL_MISSING", "DATABASE_URL_INVALID", "DATABASE_MUST_BE_LOCAL", "APPLIED_MIGRATION_CHANGED"];
    console.error(safe.includes(error.message) ? error.message : "LOCAL_MIGRATION_FAILED: check PostgreSQL availability and migration-role privileges.");
    process.exitCode = 1;
  } finally {
    await client?.end();
  }
}
