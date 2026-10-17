import test from "node:test";
import assert from "node:assert/strict";
import { localDatabaseUrl } from "../../scripts/database/migrate.mjs";

test("migration connections cannot silently select a remote server", () => {
  for (const value of [undefined, "bad-url", "https://localhost/test", "postgresql://db.example/test", "postgresql://127.0.0.1/test?host=db.example", "postgresql://127.0.0.1/test?hostaddr=192.0.2.1", "postgresql://127.0.0.1/test?service=remote"]) {
    assert.throws(() => localDatabaseUrl(value));
  }
  const local = "postgresql://test:unused@127.0.0.1:5432/swingpilot_test_foundation";
  assert.equal(localDatabaseUrl(local), local);
});
