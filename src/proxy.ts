import {NextRequest,NextResponse} from "next/server";
export function proxy(request:NextRequest){
  const expected=new URL(process.env.APP_ORIGIN??"http://127.0.0.1:3000");
  if(!["127.0.0.1","localhost","[::1]"].includes(expected.hostname)||expected.protocol!=="http:")return new NextResponse("LOCAL_CONFIGURATION_REQUIRED",{status:503});
  const host=request.headers.get("host");
  const forwarded=request.headers.get("x-forwarded-host");
  if(host!==expected.host || (forwarded&&forwarded!==expected.host))return new NextResponse("HOST_REJECTED",{status:403});
  if(!["GET","HEAD","OPTIONS"].includes(request.method)&&request.headers.get("origin")!==expected.origin)return new NextResponse("ORIGIN_REJECTED",{status:403});
  return NextResponse.next();
}
export const config={matcher:["/((?!_next/static|_next/image|favicon.ico).*)"]};
