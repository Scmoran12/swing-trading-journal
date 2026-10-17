import test from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { migrate, localDatabaseUrl } from "../../scripts/database/migrate.mjs";

const connection = process.env.SWINGPILOT_TEST_DATABASE_URL;

test("PostgreSQL foundation ownership, credentials and migration replay", { skip: !connection && "requires an isolated local swingpilot_test_* database" }, async t => {
  const url = new URL(localDatabaseUrl(connection));
  assert.match(url.pathname, /^\/swingpilot_test_[a-z0-9_]+$/, "never run against the personal database");
  const client = new pg.Client({ connectionString: connection, connectionTimeoutMillis: 5000 });
  await client.connect();
  const ownerA = "11111111-1111-4111-8111-111111111111";
  const ownerB = "22222222-2222-4222-8222-222222222222";
  try {
    assert.equal((await client.query("SELECT to_regnamespace('swingpilot') AS ns")).rows[0].ns, null, "requires a fresh test database");
    const applied=await migrate(client);assert.ok(applied.includes("0001_foundation.sql"));
    assert.deepEqual(await migrate(client), []);
    await client.query("INSERT INTO swingpilot.app_users(id,login_name,password_hash,state) VALUES ($1,'fixture-a','$argon2id$NOT_A_REAL_HASH','ACTIVE'),($2,'fixture-b','$argon2id$NOT_A_REAL_HASH','DISABLED')", [ownerA, ownerB]);
    await client.query("INSERT INTO swingpilot.profiles(id,display_name) VALUES ($1,'Fixture A'),($2,'Fixture B')", [ownerA, ownerB]);
    for (const owner of [ownerA, ownerB]) {
      await client.query(`INSERT INTO swingpilot.portfolios(owner_id,name,opening_cash,opening_cash_at,
        risk_per_trade_fraction,max_position_fraction,max_total_exposure_fraction,max_sector_fraction,cash_buffer)
        VALUES ($1,'Synthetic test portfolio','12345.12345678','2026-10-14T00:00:00Z',0.01,0.20,0.80,0.40,100)`, [owner]);
    }

    async function asOwner(owner, action) {
      await client.query("BEGIN");
      try {
        await client.query("SET LOCAL ROLE swingpilot_app");
        if (owner) await client.query("SELECT set_config('swingpilot.owner_id',$1,true)", [owner]);
        return await action();
      } finally { await client.query("ROLLBACK"); }
    }

    await t.test("missing owner sees no profiles", async () => {
      await asOwner(null, async () => assert.equal((await client.query("SELECT * FROM swingpilot.profiles")).rowCount, 0));
    });
    await t.test("each owner only reads their profile", async () => {
      for (const owner of [ownerA, ownerB]) await asOwner(owner, async () => assert.deepEqual((await client.query("SELECT id FROM swingpilot.profiles")).rows, [{ id: owner }]));
    });
    await t.test("cross-owner writes and credential reads denied", async () => {
      await asOwner(ownerA, async () => assert.equal((await client.query("UPDATE swingpilot.profiles SET display_name='Wrong' WHERE id=$1", [ownerB])).rowCount, 0));
      await asOwner(ownerA, async () => assert.rejects(client.query("INSERT INTO swingpilot.profiles(id,display_name) VALUES ($1,'Wrong')", ["33333333-3333-4333-8333-333333333333"]), error => error.code === "42501"));
      await asOwner(ownerA, async () => assert.rejects(client.query("SELECT password_hash FROM swingpilot.app_users"), error => error.code === "42501"));
      await asOwner(ownerA, async () => assert.rejects(client.query("DELETE FROM swingpilot.profiles"), error => error.code === "42501"));
    });
    await t.test("owner context does not leak after transaction", async () => {
      await asOwner(ownerA, async () => assert.equal((await client.query("SELECT * FROM swingpilot.profiles")).rowCount, 1));
      await asOwner(null, async () => assert.equal((await client.query("SELECT * FROM swingpilot.profiles")).rowCount, 0));
    });
    await t.test("one enabled owner and default dark mode enforced", async () => {
      await assert.rejects(client.query("UPDATE swingpilot.app_users SET state='ACTIVE' WHERE id=$1", [ownerB]), error => error.code === "23505");
      assert.deepEqual((await client.query("SELECT DISTINCT theme FROM swingpilot.profiles")).rows, [{ theme: "dark" }]);
    });
    await t.test("portfolio isolation, fixed decimals and cross-owner mutation denial", async () => {
      await asOwner(ownerA, async () => {
        const rows = (await client.query("SELECT owner_id,opening_cash FROM swingpilot.portfolios")).rows;
        assert.deepEqual(rows, [{ owner_id: ownerA, opening_cash: "12345.12345678" }]);
      });
      await asOwner(ownerA, async () => assert.rejects(client.query("UPDATE swingpilot.portfolios SET name='Wrong' WHERE owner_id=$1", [ownerB]), error => error.code === "42501"));
      await asOwner(ownerA, async () => assert.rejects(client.query("UPDATE swingpilot.portfolios SET owner_id=$1 WHERE owner_id=$2", [ownerB,ownerA]), error => error.code === "42501"));
    });
    await t.test("modified applied migration is rejected without changing the database", async () => {
      const directory = await mkdtemp(join(tmpdir(), "swingpilot-migration-test-"));
      try {
        const source = await readFile(new URL("../../local/migrations/0001_foundation.sql", import.meta.url), "utf8");
        await writeFile(join(directory,"0001_foundation.sql"),source+"\n-- tampered fixture\n");
        await assert.rejects(migrate(client, directory), /APPLIED_MIGRATION_CHANGED/);
        assert.equal((await client.query("SELECT count(*)::int AS n FROM swingpilot.schema_migrations")).rows[0].n, applied.length);
      } finally { await rm(directory, { recursive:true, force:true }); }
    });
  } finally { await client.end(); }
});
