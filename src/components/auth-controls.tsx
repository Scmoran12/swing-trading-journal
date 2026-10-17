"use client";
import {useState} from "react";
import {signIn,signOut} from "next-auth/react";
export function LoginForm(){
 const [error,setError]=useState("");const [busy,setBusy]=useState(false);
 return <form className="stack-form" onSubmit={async event=>{event.preventDefault();setBusy(true);setError("");const data=new FormData(event.currentTarget);try{const result=await signIn("credentials",{login:data.get("login"),password:data.get("password"),redirect:false});if(result?.error)setError("פרטי הכניסה לא אומתו. לאחר מספר ניסיונות יש להמתין 15 דקות.");else window.location.assign("/dashboard");}catch{setError("הכניסה אינה זמינה כרגע. יש לבדוק שהשירות המקומי פועל.");}finally{setBusy(false);}}}>
 <label>שם כניסה<input name="login" autoComplete="username" required maxLength={100} dir="auto" /></label><label>סיסמה<input name="password" type="password" autoComplete="current-password" required maxLength={128} /></label>{error&&<p className="form-error" role="alert">{error}</p>}<button className="primary-button" disabled={busy}>{busy?"נכנסים…":"כניסה למרחב שלי"}</button></form>;
}
export function LogoutButton(){return <button className="quiet-button" onClick={()=>signOut({callbackUrl:"/login"})}>יציאה</button>;}
