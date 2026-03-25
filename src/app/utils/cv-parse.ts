import type { CvData } from '../models/cv.model';
import { defaultCvData } from './cv-defaults';

/** Normaliza JSON vindo do localStorage ou do Supabase para `CvData` válido. */
export function normalizeCvPayload(parsed: unknown): CvData {
  const base = defaultCvData();
  if (!parsed || typeof parsed !== 'object') return base;
  const p = parsed as Partial<CvData>;
  return {
    ...base,
    ...p,
    personal: { ...base.personal, ...(p.personal ?? {}) },
    education: Array.isArray(p.education) ? p.education : base.education,
    experience: Array.isArray(p.experience) ? p.experience : base.experience,
  };
}
