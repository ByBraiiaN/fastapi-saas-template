import type { AuthUser } from "@/lib/api";

type JwtPayload = {
  sub?: unknown;
  email?: unknown;
  username?: unknown;
  provider?: unknown;
};

function decodePayload(token: string): JwtPayload | null {
  const payload = token.split(".")[1];
  if (!payload) return null;

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));

    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;
    return parsed as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Rebuilds the visible identity from the JWT without verifying the signature.
 * Only used as a fallback for legacy sessions that stored the token alone.
 */
export function userFromToken(token: string | null): AuthUser | null {
  if (!token) return null;

  const payload = decodePayload(token);
  if (!payload) return null;

  const id = typeof payload.sub === "string" ? payload.sub : null;
  const email = typeof payload.email === "string" ? payload.email : null;
  const username = typeof payload.username === "string" ? payload.username : null;

  if (!id || !email || !username) return null;

  return {
    id,
    email,
    username,
    provider: typeof payload.provider === "string" ? payload.provider : "local",
  };
}
