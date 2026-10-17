import test from'node:test';import assert from'node:assert/strict';
import {validatePassword}from'../../src/infrastructure/auth/credentials.mjs';
import{validateCommand,fingerprint}from'../../src/application/input.mjs';
test('password bounds and unknown commands are rejected',()=>{for(const value of['short','x'.repeat(129),null])assert.throws(()=>validatePassword(value));assert.throws(()=>validateCommand('__proto__',{}));});
test('fills require safe whole shares, decimal strings, timezones and explicit buy emotion',()=>{
 const body={planId:'11111111-1111-4111-8111-111111111111',expectedRevision:1,fills:[{quantity:2,price:'100.01',fee:'0',executedAt:'2026-01-01T12:00:00Z',emotion:'CALM'}]};
 assert.doesNotThrow(()=>validateCommand('BUY',body));for(const change of[{quantity:1.5},{price:100.01},{executedAt:'2026-01-01T12:00:00'},{emotion:undefined}])assert.throws(()=>validateCommand('BUY',{...body,fills:[{...body.fills[0],...change}]}));
});
test('idempotency hashing is independent of object key order',()=>{assert.equal(fingerprint('X',{a:1,b:{c:2}}),fingerprint('X',{b:{c:2},a:1}));assert.notEqual(fingerprint('X',{a:1}),fingerprint('X',{a:2}));});
