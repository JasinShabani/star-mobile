import { Buffer } from 'buffer';

if (!(global as any).Buffer) {
  (global as any).Buffer = Buffer;
}

export function fakeJwt(): string {
  const header   = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const payload  = Buffer.from(JSON.stringify({ sub: 'mock', exp: Date.now() / 1000 + 3600 })).toString('base64');
  const signature = Math.random().toString(36).slice(2, 10);
  return `${header}.${payload}.${signature}`;
}
