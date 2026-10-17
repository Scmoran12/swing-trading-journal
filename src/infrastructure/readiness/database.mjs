// Catalog/settings reads only: no authentication records, journal values or mutation probes.
export async function databaseChecks(client,kind='app'){
 if(!['app','auth'].includes(kind))throw new Error('DIAGNOSTIC_ROLE_INVALID');
 const checks=[],add=(code,pass)=>checks.push({code:kind.toUpperCase()+'_'+code,status:pass?'PASS':'FAIL'});
 const group=kind==='app'?'swingpilot_app':'swingpilot_auth';
 const roles=(await client.query(`SELECT rolname,rolsuper,rolbypassrls,rolcreatedb,rolcreaterole,rolreplication,rolinherit,rolcanlogin
  FROM pg_roles WHERE rolname IN(session_user,current_user)`)).rows;
 const unsafe=r=>r.rolsuper||r.rolbypassrls||r.rolcreatedb||r.rolcreaterole||r.rolreplication||r.rolinherit;
 const identity=(await client.query('SELECT current_user=$1 AS expected,session_user<>current_user AS separate',[group])).rows[0];
 add('RESTRICTED_ROLES',identity.expected&&identity.separate&&roles.length===2&&roles.every(r=>!unsafe(r)&&r.rolcanlogin===(r.rolname!==group)));
 const memberships=(await client.query(`SELECT count(*)::int n FROM pg_roles
  WHERE rolname NOT IN(session_user,$1) AND pg_has_role(session_user,oid,'MEMBER')`,[group])).rows[0].n;
 add('ROLE_MEMBERSHIP',memberships===0);
 const listener=(await client.query('SHOW listen_addresses')).rows[0].listen_addresses.split(',').map(s=>s.trim());
 add('POSTGRES_LOOPBACK',listener.length>0&&listener.every(v=>['127.0.0.1','::1','localhost'].includes(v)));
 add('POSTGRES_VERSION',Number((await client.query('SHOW server_version_num')).rows[0].server_version_num)>=160000);
 const rls=(await client.query(`SELECT count(*)::int n,bool_and(relrowsecurity AND relforcerowsecurity) safe FROM pg_class c
  JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='swingpilot' AND c.relkind='r'
  AND c.relname NOT IN('schema_migrations','app_users','app_sessions','login_limits')`)).rows[0];
 add('FORCED_OWNER_RLS',rls.n>=30&&rls.safe===true);
 const publicAccess=(await client.query(`SELECT EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace,
  LATERAL aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) a
  WHERE n.nspname='swingpilot' AND c.relkind='r' AND a.grantee=0) unsafe`)).rows[0].unsafe;
 add('NO_PUBLIC_TABLE_GRANTS',!publicAccess);
 const publicFunctions=(await client.query(`SELECT EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace,
  LATERAL aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a
  WHERE n.nspname='swingpilot' AND p.prosecdef AND a.grantee=0 AND a.privilege_type='EXECUTE') unsafe`)).rows[0].unsafe;
 add('NO_PUBLIC_DEFINER_EXECUTION',!publicFunctions);
 const permissions=(await client.query(`SELECT
  has_table_privilege(current_user,'swingpilot.app_users','SELECT') credentials,
  has_table_privilege(current_user,'swingpilot.trades','SELECT') trades,
  EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname='swingpilot' AND c.relkind='r' AND c.relname NOT IN('profiles','uploads','app_sessions','login_limits')
   AND has_table_privilege(current_user,c.oid,'INSERT,UPDATE,DELETE,TRUNCATE,TRIGGER,REFERENCES')) writes,
  has_schema_privilege(current_user,'swingpilot','CREATE') creates`)).rows[0];
 add('AUTHORITY_SEPARATION',permissions.credentials===(kind==='auth')&&permissions.trades===(kind==='app')&&!permissions.writes&&!permissions.creates);
 return checks;
}
