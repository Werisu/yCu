import { effect, inject, Injectable, signal } from '@angular/core';
import type { CvData, PersonalInfo } from '../models/cv.model';
import { defaultCvData } from '../utils/cv-defaults';
import { normalizeCvPayload } from '../utils/cv-parse';
import { SupabaseCvRepository } from './supabase-cv.repository';
import { SupabaseService } from './supabase.service';

const STORAGE_KEY = 'ycu_cv_v1';
const META_KEY = 'ycu_cv_v1_edited';

export type RemoteSyncState = 'disabled' | 'connecting' | 'synced' | 'error';

@Injectable({ providedIn: 'root' })
export class CvStorageService {
  private readonly key = STORAGE_KEY;
  readonly cv = signal<CvData>(defaultCvData());
  readonly remoteSyncState = signal<RemoteSyncState>('disabled');

  private readonly supabase = inject(SupabaseService);
  private readonly remoteRepo = inject(SupabaseCvRepository);

  private localEditedAt = 0;
  private skipNextMetaBump = false;
  private remoteSyncReady = false;
  private remoteUserId: string | null = null;

  constructor() {
    this.localEditedAt = this.readEditedAt();
    this.hydrate();
    if (this.shouldStampLegacyMeta()) {
      this.localEditedAt = Date.now();
      this.persistEditedAt();
    }

    this.skipNextMetaBump = true;
    effect(() => {
      const data = this.cv();
      localStorage.setItem(this.key, JSON.stringify(data));
      if (this.skipNextMetaBump) {
        this.skipNextMetaBump = false;
      } else {
        this.localEditedAt = Date.now();
        this.persistEditedAt();
      }
    });

    effect((onCleanup) => {
      const data = this.cv();
      if (!this.remoteSyncReady || !this.remoteUserId) return;
      const timer = window.setTimeout(() => {
        void this.pushRemote(data);
      }, 700);
      onCleanup(() => window.clearTimeout(timer));
    });

    void this.initRemote();
  }

  private readEditedAt(): number {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return 0;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : 0;
  }

  private persistEditedAt(): void {
    localStorage.setItem(META_KEY, String(this.localEditedAt));
  }

  /** Instalações antigas sem META: prioriza cópia local na primeira sincronização. */
  private shouldStampLegacyMeta(): boolean {
    const raw = localStorage.getItem(this.key);
    if (!raw) return false;
    if (localStorage.getItem(META_KEY)) return false;
    try {
      const o = JSON.parse(raw) as Record<string, unknown>;
      return typeof o === 'object' && o !== null && Object.keys(o).length > 0;
    } catch {
      return false;
    }
  }

  private hydrate(): void {
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return;
      this.cv.set(normalizeCvPayload(JSON.parse(raw) as unknown));
    } catch {
      /* ignore */
    }
  }

  private async initRemote(): Promise<void> {
    if (!this.supabase.enabled) {
      this.remoteSyncState.set('disabled');
      return;
    }

    this.remoteSyncState.set('connecting');
    try {
      const auth = await this.remoteRepo.ensureSession();
      if (!auth) {
        this.remoteSyncState.set('error');
        return;
      }
      this.remoteUserId = auth.userId;

      const row = await this.remoteRepo.fetchCv(auth.userId);
      if (row) {
        const serverMs = new Date(row.updatedAt).getTime();
        if (serverMs > this.localEditedAt) {
          this.skipNextMetaBump = true;
          this.localEditedAt = serverMs;
          this.persistEditedAt();
          this.cv.set(row.payload);
        }
      }

      await this.pushRemote(this.cv());
      this.remoteSyncReady = true;
      this.remoteSyncState.set('synced');
    } catch {
      this.remoteSyncState.set('error');
    }
  }

  private async pushRemote(data: CvData): Promise<void> {
    if (!this.remoteUserId) return;
    try {
      await this.remoteRepo.upsertCv(this.remoteUserId, data);
      if (this.remoteSyncState() === 'error') {
        this.remoteSyncState.set('synced');
      }
    } catch {
      this.remoteSyncState.set('error');
    }
  }

  patch(updater: (prev: CvData) => CvData): void {
    this.cv.update(updater);
  }

  patchPersonal(partial: Partial<PersonalInfo>): void {
    this.patch((c) => ({ ...c, personal: { ...c.personal, ...partial } }));
  }

  reset(): void {
    localStorage.removeItem(this.key);
    localStorage.removeItem(META_KEY);
    this.skipNextMetaBump = true;
    this.cv.set(defaultCvData());
    this.localEditedAt = Date.now();
    this.persistEditedAt();
    if (this.remoteSyncReady && this.remoteUserId) {
      void this.pushRemote(this.cv());
    }
  }
}
