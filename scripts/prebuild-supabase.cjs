/**
 * 1) Gera environment.prod.ts (substituído no build de produção).
 * 2) Gera public/supabase-runtime-config.json (servido como estático; o app lê no boot).
 *
 * Variáveis aceitas (primeira não vazia vence):
 *   SUPABASE_URL, NG_APP_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_URL, VITE_SUPABASE_URL
 *   SUPABASE_ANON_KEY, NG_APP_SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY, VITE_SUPABASE_ANON_KEY
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

function pick(...keys) {
  for (const k of keys) {
    const v = process.env[k]?.trim();
    if (v) return v;
  }
  return '';
}

const url = pick(
  'SUPABASE_URL',
  'NG_APP_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'VITE_SUPABASE_URL',
);
const key = pick(
  'SUPABASE_ANON_KEY',
  'NG_APP_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'VITE_SUPABASE_ANON_KEY',
);

const envTarget = path.join(root, 'src', 'environments', 'environment.prod.ts');
const envContent = `/* Gerado por scripts/prebuild-supabase.cjs — não edite credenciais no CI */
export const environment = {
  production: true,
  supabaseUrl: ${JSON.stringify(url)},
  supabaseAnonKey: ${JSON.stringify(key)},
};
`;
fs.writeFileSync(envTarget, envContent, 'utf8');

const publicDir = path.join(root, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
const jsonTarget = path.join(publicDir, 'supabase-runtime-config.json');
const jsonBody = JSON.stringify(
  {
    supabaseUrl: url,
    supabaseAnonKey: key,
  },
  null,
  0,
);
fs.writeFileSync(jsonTarget, `${jsonBody}\n`, 'utf8');

if (url && key) {
  console.log('[prebuild-supabase] URL e chave gravadas em environment.prod.ts e public/supabase-runtime-config.json');
} else {
  console.warn(
    '[prebuild-supabase] Nenhuma variável Supabase encontrada no ambiente. No Vercel, defina SUPABASE_URL e SUPABASE_ANON_KEY e use "npm run build" ou "npm run vercel-build" (não só "ng build").',
  );
}
