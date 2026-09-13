import { NextResponse, type NextRequest } from "next/server";

/**
 * Protege a área do restaurante.
 *
 * Usa Web Crypto (disponível no runtime Edge do middleware) para conferir a
 * assinatura HMAC do cookie de sessão. A validação completa da senha fica na
 * rota /api/admin/session, que roda em Node e tem acesso ao scrypt.
 */
const COOKIE = "mixrl_admin";

/** HMAC-SHA256 com Web Crypto, retornando hex. */
async function sign(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let index = 0; index < a.length; index += 1) {
    mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return mismatch === 0;
}

export async function middleware(request: NextRequest) {
  const { pathname, origin } = request.nextUrl;

  // A rota de login fica livre: é ela que cria a sessão.
  if (pathname === "/api/admin/session") return NextResponse.next();

  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD_HASH;
  const token = request.cookies.get(COOKIE)?.value;
  let authenticated = false;

  if (secret && token) {
    const parts = token.split(".");
    if (parts.length === 3) {
      const [, expiresAt, signature] = parts;
      const expires = Number(expiresAt);
      const notExpired = Number.isFinite(expires) && expires > Date.now();
      if (notExpired) {
        const expected = await sign(`${parts[0]}.${expiresAt}`, secret);
        authenticated = constantTimeEqual(signature, expected);
      }
    }
  }

  if (authenticated) return NextResponse.next();

  if (pathname.startsWith("/api/admin")) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const url = new URL("/", origin);
  url.searchParams.set("restaurante", "1");
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"],
};
