import {homedir} from "node:os";
import {join,isAbsolute,relative,sep,dirname} from "node:path";
import {readFile,lstat,mkdir,writeFile,rename,chmod} from "node:fs/promises";
import {execFile} from "node:child_process";
import {promisify} from "node:util";
import {localDatabaseUrl} from "../database/migrate.mjs";
import {validateLocalTargets,assertPrivateLocation} from '../../src/domain/readiness/policy.mjs';
const execute=promisify(execFile);
export function localHome(){return process.platform==="win32"?join(process.env.LOCALAPPDATA??join(homedir(),"AppData","Local"),"SwingPilot"):join(homedir(),".local","share","swingpilot");}
export const settingsPath=()=>process.env.SWINGPILOT_CONFIG_FILE??join(localHome(),"config","settings.json");
export async function secureDirectory(path){
 await mkdir(path,{recursive:true,mode:0o700});
 if((await lstat(path)).isSymbolicLink())throw new Error("UNSAFE_CONFIG_PATH");
 if(process.platform!=="win32")await chmod(path,0o700);
 if(process.platform==="win32"){
  const {stdout}=await execute("powershell.exe",["-NoProfile","-NonInteractive","-Command","[System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value"]);
  const sid=stdout.trim();if(!/^S-1-[0-9-]+$/.test(sid))throw new Error("WINDOWS_IDENTITY_UNVERIFIED");
  await execute("icacls.exe",[path,"/inheritance:r","/grant:r",`*${sid}:(OI)(CI)F`]);
 }
}
export async function readSettings(){
 const path=settingsPath();let stat;
 try{stat=await lstat(path);}catch(e){if(e.code==="ENOENT")return null;throw e;}
 if(!stat.isFile()||stat.isSymbolicLink())throw new Error("UNSAFE_CONFIG_FILE");
 if(process.platform!=="win32"&&((stat.mode&0o077)!==0||stat.uid!==process.getuid()))throw new Error("CONFIG_PERMISSIONS_REQUIRED");
 const value=JSON.parse(await readFile(path,"utf8"));
 validateLocalTargets(value);
 assertPrivateLocation(path);
 assertPrivateLocation(value.PRIVATE_DATA_DIR);
 for(const key of ["DATABASE_URL","APP_DATABASE_URL","AUTH_DATABASE_URL"])localDatabaseUrl(value[key]);
 const origin=new URL(value.APP_ORIGIN);
 if(origin.origin!==value.APP_ORIGIN||origin.protocol!=="http:"||!["127.0.0.1","localhost","[::1]"].includes(origin.hostname))throw new Error("LOCAL_ORIGIN_REQUIRED");
 if(typeof value.AUTH_SECRET!=="string"||value.AUTH_SECRET.length<64||!isAbsolute(value.PRIVATE_DATA_DIR))throw new Error("LOCAL_CONFIG_INVALID");
 const inside=relative(process.cwd(),value.PRIVATE_DATA_DIR);
 if(inside===""||(!inside.startsWith(".."+sep)&&inside!==".."&&!isAbsolute(inside)))throw new Error("PRIVATE_DATA_OUTSIDE_PROJECT_REQUIRED");
 return value;
}
export async function writeSettings(value){
 const path=settingsPath();await secureDirectory(dirname(path));
 const temporary=path+".new";await writeFile(temporary,JSON.stringify(value,null,2),{mode:0o600,flag:"wx"});await rename(temporary,path);
}
export async function loadSettings(){const value=await readSettings();if(value)for(const key of ['DATABASE_URL','APP_DATABASE_URL','AUTH_DATABASE_URL','AUTH_SECRET','APP_ORIGIN','PRIVATE_DATA_DIR'])if(typeof value[key]==='string')process.env[key]=value[key];return value;}
