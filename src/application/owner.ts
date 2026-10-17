import {auth} from "@/auth";
import {redirect} from "next/navigation";
import {configured} from "@/infrastructure/database/pools.mjs";
export async function ownerPage(){
  if(!configured())redirect("/setup");
  const session=await auth();
  if(!session?.user?.id)redirect("/login");
  return session.user;
}
export async function ownerApi(){
  if(!configured())throw new Error("LOCAL_SETUP_REQUIRED");
  const session=await auth();
  if(!session?.user?.id)throw new Error("AUTH_REQUIRED");
  return session.user.id;
}
