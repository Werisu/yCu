import { Injectable } from '@angular/core';
import type { CvData } from '../models/cv.model';
import { normalizeCvPayload } from '../utils/cv-parse';
import { SupabaseService } from './supabase.service';

export interface CvRemoteRow {
  payload: CvData;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class SupabaseCvRepository {
  constructor(private readonly supabase: SupabaseService) {}

  /** Garante sessão (inclui login anônimo se necessário). */
  async ensureSession(): Promise<{ userId: string } | null> {
    const client = this.supabase.client;
    if (!client) return null;

    const {
      data: { session },
    } = await client.auth.getSession();
    if (session?.user?.id) {
      return { userId: session.user.id };
    }

    const { data, error } = await client.auth.signInAnonymously();
    if (error || !data.user?.id) {
      console.error('[yCu] Supabase auth:', error?.message ?? 'sem usuário');
      return null;
    }
    return { userId: data.user.id };
  }

  async fetchCv(userId: string): Promise<CvRemoteRow | null> {
    const client = this.supabase.client;
    if (!client) return null;

    const { data, error } = await client
      .from('cv_data')
      .select('payload, updated_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[yCu] Supabase fetch:', error.message);
      throw error;
    }
    if (!data?.payload) return null;

    return {
      payload: normalizeCvPayload(data.payload),
      updatedAt: data.updated_at as string,
    };
  }

  async upsertCv(userId: string, payload: CvData): Promise<void> {
    const client = this.supabase.client;
    if (!client) return;

    const now = new Date().toISOString();
    const { error } = await client.from('cv_data').upsert(
      {
        user_id: userId,
        payload,
        updated_at: now,
      },
      { onConflict: 'user_id' },
    );

    if (error) {
      console.error('[yCu] Supabase upsert:', error.message);
      throw error;
    }
  }
}
