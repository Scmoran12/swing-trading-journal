"use client";
import{useEffect}from'react';
export function IdleGuard(){useEffect(()=>{
 let activity=Date.now(),checked=Date.now();const timeout=30*60*1000;
 const active=()=>{if(Date.now()-activity>=timeout){window.location.replace('/login');return;}activity=Date.now();};
 const check=async()=>{const now=Date.now();if(now-activity>=timeout){window.location.replace('/login');return;}if(now-activity<60000&&now-checked>=5*60000){checked=now;try{const r=await fetch('/api/auth/session',{cache:'no-store'});if(!r.ok||!(await r.json()).user?.id)window.location.replace('/login');}catch{window.location.replace('/login');}}};
 window.addEventListener('pointerdown',active);window.addEventListener('keydown',active);document.addEventListener('visibilitychange',check);const timer=setInterval(check,30000);
 return()=>{clearInterval(timer);window.removeEventListener('pointerdown',active);window.removeEventListener('keydown',active);document.removeEventListener('visibilitychange',check);};
},[]);return null;}
