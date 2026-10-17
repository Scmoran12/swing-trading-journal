import pg from "pg";
import { localDatabaseUrl } from "./config.mjs";

const pools = new Map();
export function configured() {
  return Boolean(process.env.APP_DATABASE_URL && process.env.AUTH_DATABASE_URL && process.env.AUTH_SECRET && process.env.PRIVATE_DATA_DIR);
}
function pool(kind) {
  const variable = kind === "auth" ? "AUTH_DATABASE_URL" : "APP_DATABASE_URL";
  const url = localDatabaseUrl(process.env[variable]);
  const key = `${kind}:${url}`;
  if (!pools.has(key)) pools.set(key, new pg.Pool({connectionString:url,max:4,connectionTimeoutMillis:5000,idleTimeoutMillis:10000}));
  return pools.get(key);
}
export async function database(kind, owner, work) {
  const client=await pool(kind).connect();
  try {
    await client.query("BEGIN");
    await client.query(kind==="auth" ? "SET LOCAL ROLE swingpilot_auth" : "SET LOCAL ROLE swingpilot_app");
    await client.query("SET LOCAL statement_timeout='10s'");
    if (kind!=="auth") {
      if (!/^[0-9a-f-]{36}$/i.test(owner??"")) throw new Error("AUTH_REQUIRED");
      await client.query("SELECT set_config('swingpilot.owner_id',$1,true)",[owner]);
    }
    const result=await work(client);
    await client.query("COMMIT");
    return result;
  } catch(error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
}
export const ownerDatabase=(owner,work)=>database("app",owner,work);
export const authDatabase=work=>database("auth",null,work);
export async function closePools(){await Promise.all([...pools.values()].map(p=>p.end()));pools.clear();}
