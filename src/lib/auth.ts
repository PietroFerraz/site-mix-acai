import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";

/**
 * Area do restaurante — autenticação.
 *
 * A senha nunca fica escrita no código. Ela é lida da variável de ambiente
 * ADMIN_PASSWORD e, para comparação, usamos scrypt (com salt aleatório) em
 * tempo constante via timingSafeEqual, o que evita vazamento por timing.
 *
 * Como definir a senha:
 *   1. Gere um hash:  node scripts/hash-senha.js "SuaSenha"
 *   2. Salve em ADMIN_PASSWORD_HASH na hospedagem (Netlify → Env vars).
 *      Se ADMIN_PASSWORD_HASH não existir, usamos ADMIN_PASSWORD em texto puro
 *      (útil para testar), e o painel avisa para configurar o hash.
 */

const SESSION_COOKIE = "mixrl_admin";
const SESSION_TTL_MS = 1000 * 60 * 60 * 8; // 8 horas

/** Cost factors keep scrypt slow enough to discourage brute force. */
const SCRYPT_KEYLEN = 64;
const SCRYPT_COST = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

export function getAdminSecret(): string | null {
  return (
    process.env.ADMIN_PASSWORD_HASH?.trim() ||
    process.env.ADMIN_PASSWORD?.trim() ||
    null
  );
}

export function isUsingHashedSecret(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD_HASH?.trim());
}

/** Gera "salt:hash" a partir de uma senha em texto puro. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, SCRYPT_KEYLEN, SCRYPT_COST).toString("hex");
  return `${salt}:${derived}`;
}

/** Compara a senha digitada com o segredo configurado, sem revelar timing. */
export function verifyPassword(candidate: string): boolean {
  const secret = getAdminSecret();
  if (!secret) return false;

  if (secret.includes(":")) {
    const [salt, expected] = secret.split(":");
    if (!salt || !expected) return false;
    const derived = scryptSync(candidate, salt, SCRYPT_KEYLEN, SCRYPT_COST);
    const expectedBuffer = Buffer.from(expected, "hex");
    if (expectedBuffer.length !== derived.length) return false;
    return timingSafeEqual(derived, expectedBuffer);
  }

  // Fallback: senha em texto puro na variável de ambiente.
  const a = Buffer.from(candidate.padEnd(64, "\0"));
  const b = Buffer.from(secret.padEnd(64, "\0"));
  return timingSafeEqual(a, b) && candidate === secret;
}

function getSessionSecret(): string {
  // Dedica uma chave à sessão; cai para a própria senha se não houver outra.
  return process.env.ADMIN_SESSION_SECRET?.trim() || getAdminSecret() || "mixrl-dev";
}

/** Cria o valor do cookie de sessão: expiração + assinatura HMAC. */
export function createSessionToken(): string {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = `admin.${expiresAt}`;
  const signature = createHmac("sha256", getSessionSecret()).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

/** Confere se o token do cookie é válido e ainda não expirou. */
export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [role, expiresAt, signature] = parts;

  const expires = Number(expiresAt);
  if (!Number.isFinite(expires) || expires < Date.now()) return false;

  const payload = `${role}.${expiresAt}`;
  const expected = createHmac("sha256", getSessionSecret()).update(payload).digest("hex");
  const a = Buffer.from(signature, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export const ADMIN_COOKIE_NAME = SESSION_COOKIE;
export const SESSION_COOKIE_MAX_AGE = SESSION_TTL_MS / 1000;
