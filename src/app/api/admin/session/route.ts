import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  SESSION_COOKIE_MAX_AGE,
  createSessionToken,
  getAdminSecret,
  verifyPassword,
  verifySessionToken,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Confere se a requisição atual já tem uma sessão válida. */
export async function GET() {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE_NAME)?.value;
  return Response.json({ authenticated: verifySessionToken(token) });
}

/** Faz login: valida a senha e cria o cookie de sessão httpOnly. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { password?: string } | null;
  const password = String(body?.password ?? "");

  if (!getAdminSecret()) {
    return NextResponse.json(
      { error: "Senha não configurada no servidor. Defina ADMIN_PASSWORD ou ADMIN_PASSWORD_HASH." },
      { status: 500 },
    );
  }

  if (!password || !verifyPassword(password)) {
    // Delay curto e constante dificulta tentativas automatizadas.
    await new Promise((resolve) => setTimeout(resolve, 400));
    return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: createSessionToken(),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE,
  });
  return response;
}

/** Faz logout removendo o cookie. */
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({ name: ADMIN_COOKIE_NAME, value: "", path: "/", maxAge: 0 });
  return response;
}
