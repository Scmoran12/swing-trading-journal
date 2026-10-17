import test from 'node:test';import assert from 'node:assert/strict';
import {sendWindowsTestToast} from '../../src/infrastructure/notifications/windows.mjs';import {receiptHash} from '../../src/application/desktop-tests.mjs';
import {requireDesktopSettings} from '../../src/infrastructure/notifications/settings.mjs';
const now=Date.parse('2026-10-17T12:00:00Z'),id='11111111-1111-4111-8111-111111111111';
const payload=()=>({appId:'Microsoft.Windows.PowerShell',code:'482619',testId:id,expiresAt:'2026-10-17T12:05:00Z'});
test('unsupported platform cannot run a sender or claim receipt',async()=>{let calls=0;assert.deepEqual(await sendWindowsTestToast(payload(),{platform:'linux',run:async()=>{calls++;},now}),{outcome:'FAILED',errorCode:'WINDOWS_REQUIRED'});assert.equal(calls,0);});
test('adapter passes only fixed synthetic fields and never returns the receipt code',async()=>{
 let sent;const result=await sendWindowsTestToast(payload(),{platform:'win32',now,run:async value=>{sent=value;return{outcome:'ACCEPTED',errorCode:null,code:value.code};}});
 assert.deepEqual(Object.keys(sent).sort(),['appId','code','expiresAt','tag']);assert.equal(sent.tag.length,16);
 assert.deepEqual(result,{outcome:'ACCEPTED',errorCode:null});assert.ok(!JSON.stringify(result).includes('482619'));
});
test('expired test and unsafe app identifiers cannot reach PowerShell',async()=>{
 let calls=0;const options={platform:'win32',now,run:async()=>{calls++;}};
 assert.equal((await sendWindowsTestToast({...payload(),expiresAt:'2026-10-17T11:59:59Z'},options)).errorCode,'TEST_EXPIRED');
 for(const appId of ['app; Start-Process bad','$(secret)','a'.repeat(181)])await assert.rejects(sendWindowsTestToast({...payload(),appId},options),/INVALID_FIXED_PAYLOAD/);
 assert.equal(calls,0);
});
test('exceptions, malformed child output and ambiguous failures prohibit automatic resend',async()=>{
 for(const reply of [null,{outcome:'DELIVERED',errorCode:null},{outcome:'FAILED',errorCode:'WINDOWS_SEND_AMBIGUOUS'},{outcome:'FAILED',errorCode:null}]){
  assert.equal((await sendWindowsTestToast(payload(),{platform:'win32',now,run:async()=>reply})).outcome,'UNKNOWN');
 }
 assert.equal((await sendWindowsTestToast(payload(),{platform:'win32',now,run:async()=>{throw new Error('potentially accepted');}})).outcome,'UNKNOWN');
 assert.equal((await sendWindowsTestToast(payload(),{platform:'win32',now,run:async()=>({outcome:'FAILED',errorCode:'APP_ID_NOT_REGISTERED'})})).outcome,'FAILED');
});
test('receipt hashes bind six digits to one test and never expose plaintext',()=>{
 assert.equal(receiptHash(id,'482619').length,64);assert.notEqual(receiptHash(id,'482619'),receiptHash('22222222-2222-4222-8222-222222222222','482619'));
 for(const code of ['12345','1234567','123abc',123456])assert.throws(()=>receiptHash(id,code),/RECEIPT_CODE_INVALID/);
});
test('test sender refuses missing/private DB mismatch and cannot fall back to a personal database',()=>{
 const config=name=>Object.fromEntries(['DATABASE_URL','APP_DATABASE_URL','AUTH_DATABASE_URL'].map(key=>[key,'postgresql://127.0.0.1/'+name]));
 assert.throws(()=>requireDesktopSettings(null,true),/LOCAL_SETUP_REQUIRED/);
 assert.throws(()=>requireDesktopSettings(config('swingpilot'),true),/ISOLATED_TEST_DATABASE_REQUIRED/);
 assert.doesNotThrow(()=>requireDesktopSettings(config('swingpilot_test_acceptance'),true));
 const mixed=config('swingpilot_test_acceptance');mixed.AUTH_DATABASE_URL='postgresql://127.0.0.1/swingpilot';assert.throws(()=>requireDesktopSettings(mixed,true),/DESKTOP_DATABASE_MISMATCH/);
});
