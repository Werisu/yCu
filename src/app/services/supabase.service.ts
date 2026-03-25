import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

/**
 * O cliente padrão do Supabase usa `navigator.locks` para sincronizar sessão entre abas.
 * Com Angular + Zone.js e hot reload, várias chamadas concorrentes a `getSession` / refresh
 * disparam `NavigatorLockAcquireTimeoutError` (“immediately failed”).
 * Executar a operação sem lock global evita isso; o risco é corrida rara com duas abas abertas.
 */
async function authLockNoop<R>(
  _name: string,
  _acquireTimeout: number,
  fn: () => Promise<R>,
): Promise<R> {
  return fn();
}

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  readonly client: SupabaseClient | null;

  constructor() {
    const url = environment.supabaseUrl?.trim();
    const key = environment.supabaseAnonKey?.trim();
    if (url && key) {
      this.client = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          lock: authLockNoop,
        },
      });
    } else {
      this.client = null;
    }
  }

  get enabled(): boolean {
    return this.client !== null;
  }
}
