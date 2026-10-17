import {ownerApi}from'@/application/owner';
import {boundedBody}from'@/application/input.mjs';
import {storeImage}from'@/infrastructure/files/private.mjs';
import {apiError}from'@/application/http';
export async function POST(request:Request){try{return Response.json(await storeImage(await ownerApi(),await boundedBody(request,5242880)),{status:201});}catch(e){return apiError(e);}}
