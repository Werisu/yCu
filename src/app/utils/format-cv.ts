import type { CvData } from '../models/cv.model';

function block(title: string, body: string): string {
  const t = body.trim();
  if (!t) return '';
  return `${title}\n${t}\n`;
}

export function formatCvAsText(data: CvData): string {
  const { personal, objective, education, experience, skills, languages, courses, certifications } =
    data;
  const lines: string[] = [];

  const name = personal.fullName.trim() || 'Currículo (nome não informado)';
  lines.push(`═══ ${name.toUpperCase()} ═══`);
  lines.push('');

  const dados: string[] = [];
  if (personal.email) dados.push(`E-mail: ${personal.email}`);
  if (personal.phone) dados.push(`Telefone: ${personal.phone}`);
  if (personal.cityState) dados.push(`Cidade/UF: ${personal.cityState}`);
  if (personal.linkedin) dados.push(`LinkedIn: ${personal.linkedin}`);
  if (personal.portfolio) dados.push(`Portfólio/Site: ${personal.portfolio}`);
  lines.push(block('DADOS PESSOAIS', dados.join('\n')));

  lines.push(block('OBJETIVO / RESUMO PROFISSIONAL', objective));

  const eduBlocks = education
    .filter((e) => e.institution.trim() || e.course.trim())
    .map((e) => {
      const header = [e.degree, e.course, e.institution].filter(Boolean).join(' — ');
      const period = [e.startYear, e.endYear || (e.status ? e.status : '')].filter(Boolean).join(' a ');
      const extra = [period && `(${period})`, e.status && !e.endYear ? e.status : ''].filter(Boolean);
      return `• ${header}${extra.length ? ' ' + extra.join(' ') : ''}`.trim();
    })
    .join('\n');
  lines.push(block('FORMAÇÃO', eduBlocks));

  const expBlocks = experience
    .filter((x) => x.company.trim() || x.role.trim())
    .map((x) => {
      const period = x.current
        ? `${x.startDate || '?'} — Atual`
        : [x.startDate, x.endDate].filter(Boolean).join(' — ') || '';
      const head = `• ${x.role}${x.company ? ` — ${x.company}` : ''}${period ? ` (${period})` : ''}`;
      const desc = x.description.trim();
      return desc ? `${head}\n  ${desc.replace(/\n/g, '\n  ')}` : head;
    })
    .join('\n\n');
  lines.push(block('EXPERIÊNCIA PROFISSIONAL', expBlocks));

  lines.push(block('HABILIDADES / COMPETÊNCIAS', skills));
  lines.push(block('IDIOMAS', languages));
  lines.push(block('CURSOS E TREINAMENTOS', courses));
  lines.push(block('CERTIFICAÇÕES', certifications));

  return lines.filter(Boolean).join('\n').trim();
}

export function formatCvAsJson(data: CvData): string {
  return JSON.stringify(data, null, 2);
}
