export function apiError(error:unknown){
 const e=error as {message?:string;code?:string};
 const safe=typeof e.message==='string'&&/^[A-Z_]{3,70}$/.test(e.message)?e.message:'LOCAL_REQUEST_FAILED';
 const status=safe==='AUTH_REQUIRED'?401:safe==='NOT_FOUND'?404:safe==='REVISION_CONFLICT'||safe==='IDEMPOTENCY_CONFLICT'?409:safe==='LOCAL_SETUP_REQUIRED'?503:400;
 return Response.json({error:safe},{status,headers:{'Cache-Control':'private, no-store'}});
}
