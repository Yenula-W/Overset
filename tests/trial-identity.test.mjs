import {test} from 'node:test';
import assert from 'node:assert/strict';
import {trialDigest,validTrialCookie,trialNetwork} from '../src/lib/server/trial-identity.ts';
const id='11111111-1111-4111-8111-111111111111';
test('trial identity rejects forged cookies and separates signing from stored identifiers',()=>{
 const signature=trialDigest('test-secret','cookie',id);
 assert.equal(validTrialCookie('test-secret',`${id}.${signature}`),true);
 assert.equal(validTrialCookie('another-secret',`${id}.${signature}`),false);
 assert.equal(validTrialCookie('test-secret',`${id}.${'0'.repeat(64)}`),false);
 assert.equal(validTrialCookie('test-secret',`${id}.${signature}.extra`),false);
 assert.equal(validTrialCookie('test-secret','broken'),false);
 assert.notEqual(signature,trialDigest('test-secret','device',id));
});
test('rotating IPv6 addresses and alternate spellings share a network bucket',()=>{
 assert.equal(trialNetwork('2001:db8:1:2::1'),trialNetwork('2001:0db8:0001:0002:ffff:aaaa:bbbb:cccc'));
 assert.notEqual(trialNetwork('2001:db8:1:2::1'),trialNetwork('2001:db8:1:3::1'));
 assert.equal(trialNetwork('192.0.2.1'),'192.0.2.1');
 assert.equal(trialNetwork('::ffff:192.0.2.1'),'192.0.2.1');
});
