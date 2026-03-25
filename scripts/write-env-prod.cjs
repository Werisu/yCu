/**
 * Gera `src/environments/environment.prod.ts` a partir de variáveis de ambiente.
 * No Vercel: Project Settings → Environment Variables → Production:
 *   SUPABASE_URL, SUPABASE_ANON_KEY
 * (Alternativas: NG_APP_SUPABASE_URL, NG_APP_SUPABASE_ANON_KEY)
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const target = path.join(root, 'src', 'environments', 'environment.prod.ts');

const url =
  process.env.SUPABASE_URL?.trim() ||
  process.env.NG_APP_SUPABASE_URL?.trim() ||
  '';
const key =
  process.env.SUPABASE_ANON_KEY?.trim() ||
  process.env.NG_APP_SUPABASE_ANON_KEY?.trim() ||
  '';

const content = `/* Gerado por scripts/write-env-prod.cjs no build — não edite credenciais aqui no CI */
export const environment = {
  production: true,
  supabaseUrl: ${JSON.stringify(url)},
  supabaseAnonKey: ${JSON.stringify(key)},
};
`;

fs.writeFileSync(target, content, 'utf8');
if (url && key) {
  console.log('[write-env-prod] Supabase: URL e chave definidas para o bundle de produção.');
} else {
  console.log(
    '[write-env-prod] Supabase vazio: defina SUPABASE_URL e SUPABASE_ANON_KEY no provedor de deploy (ex.: Vercel).',
  );
}
