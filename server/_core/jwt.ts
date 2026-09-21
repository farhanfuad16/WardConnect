import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { webcrypto } from "node:crypto";

if (!globalThis.crypto) {
  Object.defineProperty(globalThis, "crypto", { value: webcrypto });
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = "7d";

if (!JWT_SECRET) {
  console.warn("[JWT] JWT_SECRET not set — auth tokens will fail");
}

function getSecretKey(): Uint8Array {
  return new TextEncoder().encode(JWT_SECRET ?? "fallback-secret-do-not-use");
}

export interface AuthJWTPayload extends JWTPayload {
  userId: number;
  email: string;
  name: string;
}

export async function signAuthToken(payload: {
  userId: number;
  email: string;
  name: string;
}): Promise<string> {
  return new SignJWT({
    userId: payload.userId,
    email: payload.email,
    name: payload.name,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(getSecretKey());
}

export async function verifyAuthToken(
  token: string,
): Promise<AuthJWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    });
    return payload as AuthJWTPayload;
  } catch {
    return null;
  }
}
