import {ownerApi}from'@/application/owner';
import {getImage}from'@/infrastructure/files/private.mjs';
import {apiError}from'@/application/http';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){try{
 const bytes=await getImage(await ownerApi(),(await params).id);
 return new Response(new Uint8Array(bytes),{headers:{'Content-Type':'image/png','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}catch(e){return apiError(e);}}
