export const DEFAULT_PROFILE_FIELD_IDS = {
  FULL_NAME_AR: 'fullNameAr',
  FULL_NAME_EN: 'fullNameEn',
  EMAIL: 'email',
  PHONE: 'phone',
  COUNTRY: 'country',
  JOB_TITLE: 'jobTitle',
  SPECIALTY: 'specialty',
  GENDER: 'gender',
  WORKPLACE: 'workplace',
  PROFESSIONAL_CARD_DOCUMENT: 'professionalCardDocument',
  PROFILE_DECLARATION: 'profileDeclaration',
} as const;

export const ALL_DEFAULT_PROFILE_FIELD_IDS = Object.values(DEFAULT_PROFILE_FIELD_IDS);
