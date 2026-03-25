import type { CvData, Education, Experience } from '../models/cv.model';
import { newId } from '../models/cv.model';

export function emptyPersonal(): CvData['personal'] {
  return {
    fullName: '',
    email: '',
    phone: '',
    cityState: '',
    linkedin: '',
    portfolio: '',
  };
}

export function emptyEducation(): Education {
  return {
    id: newId(),
    institution: '',
    course: '',
    degree: '',
    startYear: '',
    endYear: '',
    status: '',
  };
}

export function emptyExperience(): Experience {
  return {
    id: newId(),
    company: '',
    role: '',
    startDate: '',
    endDate: '',
    current: false,
    description: '',
  };
}

export function defaultCvData(): CvData {
  return {
    personal: emptyPersonal(),
    objective: '',
    education: [],
    experience: [],
    skills: '',
    languages: '',
    courses: '',
    certifications: '',
  };
}
