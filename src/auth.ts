import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authenticate, validSession, revokeSession } from "@/infrastructure/auth/credentials.mjs";
import { configured } from "@/infrastructure/database/pools.mjs";

export const {handlers,auth,signIn,signOut}=NextAuth({
  trustHost:true,
  secret:process.env.AUTH_SECRET,
  useSecureCookies:false, // Loopback HTTP only, enforced by proxy; LAN/public access remains disabled.
  session:{strategy:"jwt",maxAge:8*60*60},
  pages:{signIn:"/login",error:"/login"},
  providers:[Credentials({credentials:{login:{},password:{}},async authorize(credentials){
    if(!configured())return null;
    try{return await authenticate(credentials.login,credentials.password);}catch{return null;}
  }})],
  callbacks:{
    async jwt({token,user}){
      if(user){const u=user as typeof user & {sid:string;epoch:string};token.sid=u.sid;token.epoch=u.epoch;}
      try{if(!await validSession(token.sid,token.sub,token.epoch))return null;}catch{return null;}
      return token;
    },
    async session({session,token}){session.user.id=token.sub!;return session;},
    async redirect({url,baseUrl}){
      const origin=process.env.APP_ORIGIN??"http://127.0.0.1:3000";
      if(url.startsWith("/")&&!url.startsWith("//"))return origin+url;
      try{return new URL(url).origin===origin?url:origin+"/dashboard";}catch{return baseUrl;}
    },
  },
  events:{async signOut(message){if("token" in message)await revokeSession(message.token?.sid);}},
  logger:{error(){console.error("AUTH_REQUEST_FAILED");},warn(){},debug(){}},
});
