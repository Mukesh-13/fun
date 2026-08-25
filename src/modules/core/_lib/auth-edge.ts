import * as jose from 'jose';

export function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not defined.');
  }
  return new TextEncoder().encode(secret);
}

export async function verifySessionTokenEdge(token: string) {
  try {
    const secret = getJwtSecret();
    const { payload } = await jose.jwtVerify(token, secret, { algorithms: ['HS256'] });
    return payload;
  } catch {
    return null;
  }
}
