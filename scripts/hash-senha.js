/**
 * Gera o hash seguro da senha do painel.
 *
 * Uso:
 *   node scripts/hash-senha.js "MinhaSenha"
 *
 * Depois copie a linha impressa e salve na hospedagem como ADMIN_PASSWORD_HASH.
 * Netlify: Site configuration → Environment variables → Add variable.
 */
const { randomBytes, scryptSync } = require("crypto");

const password = process.argv[2];

if (!password) {
  console.error("Uso: node scripts/hash-senha.js \"SuaSenha\"");
  process.exit(1);
}

const salt = randomBytes(16).toString("hex");
const derived = scryptSync(password, salt, 64, {
  N: 16384,
  r: 8,
  p: 1,
  maxmem: 64 * 1024 * 1024,
}).toString("hex");

console.log("\nAdicione na hospedagem (Netlify → Environment variables):\n");
console.log(`ADMIN_PASSWORD_HASH=${salt}:${derived}\n`);
