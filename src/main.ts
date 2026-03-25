import { bootstrapApplication } from '@angular/platform-browser';
import { environment } from './environments/environment';
import { setSupabaseRuntimeConfig } from './app/config/supabase-runtime';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

async function main(): Promise<void> {
  let url = environment.supabaseUrl?.trim() ?? '';
  let key = environment.supabaseAnonKey?.trim() ?? '';

  try {
    const cfgUrl = new URL('supabase-runtime-config.json', document.baseURI).href;
    const res = await fetch(cfgUrl, { cache: 'no-store' });
    if (res.ok) {
      const j = (await res.json()) as Record<string, unknown>;
      const ru = typeof j['supabaseUrl'] === 'string' ? j['supabaseUrl'].trim() : '';
      const rk = typeof j['supabaseAnonKey'] === 'string' ? j['supabaseAnonKey'].trim() : '';
      if (ru && rk) {
        url = ru;
        key = rk;
      }
    }
  } catch {
    /* rede ou arquivo ausente: mantém environment */
  }

  setSupabaseRuntimeConfig(url, key);

  await bootstrapApplication(AppComponent, appConfig);
}

main().catch((err) => console.error(err));
