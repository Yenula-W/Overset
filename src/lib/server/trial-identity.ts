import { createHmac, timingSafeEqual } from 'node:crypto';

export function trialDigest(secret: string, purpose: string, value: string) {
  return createHmac('sha256', secret).update(`overset-trial:${purpose}:${value}`).digest('hex');
}
export function validTrialCookie(secret: string, value: string) {
  const parts = value.split('.');
  if (parts.length !== 2 || !/^[0-9a-f-]{36}$/.test(parts[0]) || !/^[0-9a-f]{64}$/.test(parts[1])) return false;
  return timingSafeEqual(Buffer.from(parts[1]), Buffer.from(trialDigest(secret, 'cookie', parts[0])));
}
/** IPv6 addresses share a /64 network bucket so rotating interface addresses do not reset it. */
export function trialNetwork(ip: string) {
  if (!ip.includes(':')) return ip;
  const canonical = new URL(`http://[${ip}]/`).hostname.slice(1,-1);
  const [left,right] = canonical.split('::');
  const a=left ? left.split(':') : [], b=right ? right.split(':') : [];
  const expanded=right === undefined ? a : [...a,...Array(8-a.length-b.length).fill('0'),...b];
  // IPv4-mapped IPv6 represents one IPv4 address, not a shared IPv6 subnet.
  if(expanded.slice(0,5).every(x=>parseInt(x,16)===0)&&expanded[5]==='ffff') {
    const first=parseInt(expanded[6],16),last=parseInt(expanded[7],16);
    return `${first>>8}.${first&255}.${last>>8}.${last&255}`;
  }
  return expanded.slice(0,4).map(x=>x.padStart(4,'0')).join(':')+'::/64';
}
