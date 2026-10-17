import {mkdir,realpath,lstat,writeFile,readFile,unlink}from'node:fs/promises';
import {isAbsolute,relative,sep,join}from'node:path';
import {randomUUID}from'node:crypto';
import sharp from'sharp';
import {validId}from'../../application/input.mjs';
import {ownerDatabase}from'../database/pools.mjs';
import {assertPrivateLocation}from'../../domain/readiness/policy.mjs';
export async function privateFolder(owner){
 validId(owner);const configured=process.env.PRIVATE_DATA_DIR;if(!configured||!isAbsolute(configured))throw new Error('PRIVATE_STORAGE_REQUIRED');
 const rel=relative(process.cwd(),configured);if(rel===''||(!rel.startsWith('..'+sep)&&rel!=='..'&&!isAbsolute(rel)))throw new Error('PRIVATE_STORAGE_OUTSIDE_PROJECT_REQUIRED');
 await mkdir(configured,{recursive:true,mode:0o700});if((await lstat(configured)).isSymbolicLink())throw new Error('UNSAFE_STORAGE_PATH');
 const root=await realpath(configured);assertPrivateLocation(root,await realpath(process.cwd()));
 const rootStat=await lstat(root);
 if(process.platform!=='win32'&&((rootStat.mode&0o077)!==0||rootStat.uid!==process.getuid()))throw new Error('PRIVATE_PERMISSIONS_REQUIRED');
 const folder=join(root,owner);await mkdir(folder,{recursive:true,mode:0o700});
 if((await lstat(folder)).isSymbolicLink()||await realpath(folder)!==folder)throw new Error('UNSAFE_STORAGE_PATH');return folder;
}
export async function storeImage(owner,bytes){
 if(bytes.length>5242880)throw new Error('IMAGE_TOO_LARGE');
 const metadata=await sharp(bytes,{limitInputPixels:20000000}).metadata();if(!['png','jpeg','webp'].includes(metadata.format))throw new Error('IMAGE_FORMAT_UNSUPPORTED');
 const output=await sharp(bytes,{limitInputPixels:20000000}).rotate().png().toBuffer();if(output.length>10485760)throw new Error('IMAGE_TOO_LARGE');
 const folder=await privateFolder(owner);const id=randomUUID();const file=join(folder,id+'.png');
 await writeFile(file,output,{mode:0o600,flag:'wx'});
 try{await ownerDatabase(owner,async client=>{
  await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,19485004))',[owner]);
  const count=(await client.query('SELECT count(*)::int n,coalesce(sum(bytes),0)::bigint bytes FROM swingpilot.uploads')).rows[0];
  if(count.n>=100||Number(count.bytes)+output.length>52428800)throw new Error('PRIVATE_STORAGE_LIMIT');
  await client.query("INSERT INTO swingpilot.uploads(id,owner_id,storage_key,bytes,content_type)VALUES($1,$2,$3,$4,'image/png')",[id,owner,`${owner}/${id}.png`,output.length]);
 });}catch(e){await unlink(file);throw e;}
 return{id,bytes:output.length};
}
export async function getImage(owner,id){
 validId(id);const row=await ownerDatabase(owner,async client=>(await client.query('SELECT id FROM swingpilot.uploads WHERE id=$1',[id])).rows[0]);
 if(!row)throw new Error('NOT_FOUND');const file=join(await privateFolder(owner),id+'.png');
 if(!(await lstat(file)).isFile()||(await lstat(file)).isSymbolicLink())throw new Error('NOT_FOUND');return readFile(file);
}
