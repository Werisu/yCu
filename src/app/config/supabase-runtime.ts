let runtimeUrl = '';
let runtimeKey = '';

/** Chamado em `main.ts` antes do bootstrap (ex.: após carregar JSON do deploy). */
export function setSupabaseRuntimeConfig(url: string, key: string): void {
  runtimeUrl = url.trim();
  runtimeKey = key.trim();
}

export function getSupabaseRuntimeConfig(): { url: string; key: string } {
  return { url: runtimeUrl, key: runtimeKey };
}
