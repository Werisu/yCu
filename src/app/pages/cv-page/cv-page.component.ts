import { Component, computed, inject, signal } from '@angular/core';
import type { Education, Experience, PersonalInfo } from '../../models/cv.model';
import { CvStorageService } from '../../services/cv-storage.service';
import { emptyEducation, emptyExperience } from '../../utils/cv-defaults';
import { formatCvAsJson, formatCvAsText } from '../../utils/format-cv';

type TabId =
  | 'inicio'
  | 'pessoal'
  | 'objetivo'
  | 'formacao'
  | 'experiencia'
  | 'complementos'
  | 'enviar';

@Component({
  selector: 'app-cv-page',
  imports: [],
  templateUrl: './cv-page.component.html',
  styleUrl: './cv-page.component.scss',
})
export class CvPageComponent {
  readonly storage = inject(CvStorageService);
  readonly copyrightYear = new Date().getFullYear();
  readonly activeTab = signal<TabId>('inicio');

  readonly tabs: { id: TabId; label: string }[] = [
    { id: 'inicio', label: 'Início' },
    { id: 'pessoal', label: 'Dados' },
    { id: 'objetivo', label: 'Objetivo' },
    { id: 'formacao', label: 'Formação' },
    { id: 'experiencia', label: 'Experiência' },
    { id: 'complementos', label: 'Extras' },
    { id: 'enviar', label: 'Enviar' },
  ];

  readonly textExport = computed(() => formatCvAsText(this.storage.cv()));
  readonly jsonExport = computed(() => formatCvAsJson(this.storage.cv()));

  setTab(id: TabId): void {
    this.activeTab.set(id);
  }

  val(e: Event): string {
    return (e.target as HTMLInputElement | HTMLTextAreaElement).value;
  }

  checked(e: Event): boolean {
    return (e.target as HTMLInputElement).checked;
  }

  patchPersonal(partial: Partial<PersonalInfo>): void {
    this.storage.patchPersonal(partial);
  }

  setObjective(v: string): void {
    this.storage.patch((c) => ({ ...c, objective: v }));
  }

  patchEd(id: string, partial: Partial<Education>): void {
    this.storage.patch((c) => ({
      ...c,
      education: c.education.map((e) => (e.id === id ? { ...e, ...partial } : e)),
    }));
  }

  addEducation(): void {
    this.storage.patch((c) => ({ ...c, education: [...c.education, emptyEducation()] }));
  }

  removeEducation(id: string): void {
    this.storage.patch((c) => ({ ...c, education: c.education.filter((e) => e.id !== id) }));
  }

  patchEx(id: string, partial: Partial<Experience>): void {
    this.storage.patch((c) => ({
      ...c,
      experience: c.experience.map((e) => (e.id === id ? { ...e, ...partial } : e)),
    }));
  }

  addExperience(): void {
    this.storage.patch((c) => ({ ...c, experience: [...c.experience, emptyExperience()] }));
  }

  removeExperience(id: string): void {
    this.storage.patch((c) => ({ ...c, experience: c.experience.filter((e) => e.id !== id) }));
  }

  setSkills(v: string): void {
    this.storage.patch((c) => ({ ...c, skills: v }));
  }

  setLanguages(v: string): void {
    this.storage.patch((c) => ({ ...c, languages: v }));
  }

  setCourses(v: string): void {
    this.storage.patch((c) => ({ ...c, courses: v }));
  }

  setCertifications(v: string): void {
    this.storage.patch((c) => ({ ...c, certifications: v }));
  }

  async copyText(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.textExport());
      window.alert('O texto do currículo foi copiado. Cole no WhatsApp ou em um e-mail.');
    } catch {
      window.alert('Não foi possível copiar. Selecione o texto na pré-visualização manualmente.');
    }
  }

  async copyJson(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.jsonExport());
      window.alert('JSON copiado — útil se quiser importar em outro sistema.');
    } catch {
      window.alert('Não foi possível copiar o JSON.');
    }
  }

  async shareText(): Promise<void> {
    const text = this.textExport();
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Meu currículo', text });
      } else {
        await navigator.clipboard.writeText(text);
        window.alert('Compartilhamento não disponível neste navegador. O texto foi copiado.');
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      window.alert('Não foi possível compartilhar. Tente copiar o texto.');
    }
  }

  confirmReset(): void {
    if (window.confirm('Limpar tudo? Todos os dados salvos neste navegador serão apagados.')) {
      this.storage.reset();
      this.activeTab.set('inicio');
    }
  }
}
