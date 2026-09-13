# Deploy na Netlify

## Por que o build quebrou antes

O `src/db/index.ts` criava a conexão com o PostgreSQL **ao ser importado** e
lançava `Error: DATABASE_URL is required`. O `next build` importa esses módulos
para coletar os dados das páginas, e a Netlify não tem o banco local — por isso:

```
Error: DATABASE_URL is required
> Build error occurred
Error: Failed to collect page data for /api/admin/categories/[id]
```

**Corrigido:** o cliente do banco agora é **lazy**. Importar o módulo não conecta
mais em nada; a conexão só acontece quando uma query realmente roda. Como todas
as rotas que tocam o banco são `force-dynamic`, o build não precisa de banco.

Você pode confirmar localmente:

```bash
env -u DATABASE_URL npm run build   # passa sem DATABASE_URL
```

## Passo a passo na Netlify

1. **Crie um banco PostgreSQL na nuvem** (o `127.0.0.1` do `.env` não existe lá):
   - [Neon](https://neon.tech) — tem plano grátis
   - [Supabase](https://supabase.com) — tem plano grátis
   - [Railway](https://railway.app)

2. **Copie a connection string**, algo como:
   ```
   postgresql://usuario:senha@ep-xxx.aws.neon.tech/neondb?sslmode=require
   ```

3. **Crie as tabelas** uma vez, a partir da sua máquina, apontando para o banco
   novo:
   ```bash
   DATABASE_URL="postgresql://..." npx drizzle-kit push
   ```
   O cardápio inicial (MIX RL, sabores e tamanhos) é inserido automaticamente na
   primeira visita ao site.

4. **Na Netlify**, em *Site configuration → Environment variables*, adicione:

   | Key            | Value                                   |
   | -------------- | --------------------------------------- |
   | `DATABASE_URL` | a connection string do passo 2          |

5. **Deploy**. O `netlify.toml` deste repositório já configura o build
   (`npm run build`, publish `.next`) e o plugin oficial do Next.js.

## Checando depois do deploy

- `https://SEU-SITE.netlify.app/api/health` deve responder `{"ok":true}`
- `https://SEU-SITE.netlify.app/` mostra o cardápio
- `https://SEU-SITE.netlify.app/admin` é o painel (aberto, sem senha — proteja
  antes de divulgar se não quiser que editem o cardápio)

## Sem banco configurado

Se `DATABASE_URL` faltar ou o banco estiver inacessível, **o site não quebra**:
as páginas mostram uma mensagem amigável e um botão para o WhatsApp
`(82) 98745-3666`.
