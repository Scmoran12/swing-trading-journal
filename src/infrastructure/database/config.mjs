export function localDatabaseUrl(value){
 if(!value)throw new Error('DATABASE_URL_MISSING');let url;try{url=new URL(value);}catch{throw new Error('DATABASE_URL_INVALID');}
 if(!['postgres:','postgresql:'].includes(url.protocol)||!['localhost','127.0.0.1','[::1]'].includes(url.hostname)||[...url.searchParams.keys()].some(k=>['host','hostaddr','port','dbname','service'].includes(k.toLowerCase())))throw new Error('DATABASE_MUST_BE_LOCAL');return value;
}
