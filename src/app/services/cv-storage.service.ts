import { effect, Injectable, signal } from '@angular/core';
import type { CvData, PersonalInfo } from '../models/cv.model';
import { defaultCvData } from '../utils/cv-defaults';

const STORAGE_KEY = 'ycu_cv_v1';

@Injectable({ providedIn: 'root' })
export class CvStorageService {
  private readonly key = STORAGE_KEY;
  readonly cv = signal<CvData>(defaultCvData());

  constructor() {
    this.hydrate();
    effect(() => {
      localStorage.setItem(this.key, JSON.stringify(this.cv()));
    });
  }

  private hydrate(): void {
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<CvData>;
      if (!parsed || typeof parsed !== 'object') return;
      const base = defaultCvData();
      this.cv.set({
        ...base,
        ...parsed,
        personal: { ...base.personal, ...(parsed.personal ?? {}) },
        education: Array.isArray(parsed.education) ? parsed.education : base.education,
        experience: Array.isArray(parsed.experience) ? parsed.experience : base.experience,
      });
    } catch {
      /* ignore */
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
    this.cv.set(defaultCvData());
  }
}
