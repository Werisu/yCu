export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  cityState: string;
  linkedin: string;
  portfolio: string;
}

export interface Education {
  id: string;
  institution: string;
  course: string;
  degree: string;
  startYear: string;
  endYear: string;
  status: string;
}

export interface Experience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface CvData {
  personal: PersonalInfo;
  objective: string;
  education: Education[];
  experience: Experience[];
  skills: string;
  languages: string;
  courses: string;
  certifications: string;
}

export function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
