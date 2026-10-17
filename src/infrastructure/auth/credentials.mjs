import argon2 from "argon2";
import { createHash, randomUUID, randomBytes } from "node:crypto";
import { authDatabase } from "../database/pools.mjs";

export const hashToken=value=>createHash("sha256").update(value).digest("hex");
export const passwordOptions={type:argon2.argon2id,memoryCost:19456,timeCost:3,parallelism:1};
export function validatePassword(value){
  if(typeof value!=="string" || value.length<12 || value.length>128)throw new Error("PASSWORD_LENGTH");
  return value;
}
let dummyHash;
export async function authenticate(login,password){
  if(typeof login!=="string" || typeof password!=="string" || login.length>100 || password.length>128) return null;
  const name=login.trim().toLowerCase();
  const bucket=hashToken(name);
  return authDatabase(async client=>{
    // One local owner: serialize throttling and reserve attempts before password work.
    await client.query("SELECT pg_advisory_xact_lock(19485002)");
    for(const [key,limit] of [["global",20],[bucket,5]]){
      const r=await client.query(`INSERT INTO swingpilot.login_limits(bucket,attempts,window_started_at) VALUES($1,1,now())
        ON CONFLICT(bucket) DO UPDATE SET attempts=CASE WHEN login_limits.window_started_at<now()-interval '15 minutes' THEN 1 ELSE login_limits.attempts+1 END,
        window_started_at=CASE WHEN login_limits.window_started_at<now()-interval '15 minutes' THEN now() ELSE login_limits.window_started_at END RETURNING attempts`,[key]);
      if(r.rows[0].attempts>limit)return null;
    }
    const result=await client.query("SELECT id,login_name,password_hash,session_epoch FROM swingpilot.app_users WHERE login_name=$1 AND state='ACTIVE'",[name]);
    const user=result.rows[0];
    dummyHash??=argon2.hash(randomBytes(32),passwordOptions);
    const valid=await argon2.verify(user?.password_hash??await dummyHash,password);
    if(!user || !valid)return null;
    await client.query("DELETE FROM swingpilot.login_limits WHERE bucket=$1",[bucket]);
    const sid=randomUUID();
    await client.query(`INSERT INTO swingpilot.app_sessions(owner_id,session_token_hash,session_epoch,expires_at)
      VALUES($1,$2,$3,now()+interval '8 hours')`,[user.id,hashToken(sid),user.session_epoch]);
    return {id:user.id,name:user.login_name,sid,epoch:String(user.session_epoch)};
  });
}
export async function validSession(sid,owner,epoch){
  if(typeof sid!=="string" || typeof owner!=="string" || typeof epoch!=="string")return false;
  return authDatabase(async client=>{
    const result=await client.query(`UPDATE swingpilot.app_sessions s SET last_seen_at=now()
      FROM swingpilot.app_users u WHERE s.owner_id=u.id AND u.id=$1 AND u.state='ACTIVE'
      AND s.session_token_hash=$2 AND s.session_epoch=$3::bigint AND u.session_epoch=s.session_epoch
      AND s.revoked_at IS NULL AND s.expires_at>now() AND s.last_seen_at>now()-interval '30 minutes' RETURNING s.id`,[owner,hashToken(sid),epoch]);
    return result.rowCount===1;
  });
}
export async function revokeSession(sid){
  if(typeof sid!=="string")return;
  await authDatabase(client=>client.query("UPDATE swingpilot.app_sessions SET revoked_at=now() WHERE session_token_hash=$1",[hashToken(sid)]));
}
