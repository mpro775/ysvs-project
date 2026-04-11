export const DEFAULT_PROFILE_FIELD_IDS = {
  fullNameAr: 'fullNameAr',
  fullNameEn: 'fullNameEn',
  email: 'email',
  phone: 'phone',
  country: 'country',
  jobTitle: 'jobTitle',
  specialty: 'specialty',
  gender: 'gender',
  workplace: 'workplace',
  professionalCardDocument: 'professionalCardDocument',
  profileDeclaration: 'profileDeclaration',
} as const;

export const ALL_DEFAULT_PROFILE_FIELD_IDS = Object.values(DEFAULT_PROFILE_FIELD_IDS);

export const DEFAULT_PROFILE_FIELD_OPTIONS = [
  { id: DEFAULT_PROFILE_FIELD_IDS.fullNameAr, label: 'الاسم الكامل (عربي)' },
  { id: DEFAULT_PROFILE_FIELD_IDS.fullNameEn, label: 'الاسم الكامل (إنجليزي)' },
  { id: DEFAULT_PROFILE_FIELD_IDS.email, label: 'البريد الإلكتروني' },
  { id: DEFAULT_PROFILE_FIELD_IDS.phone, label: 'رقم الهاتف' },
  { id: DEFAULT_PROFILE_FIELD_IDS.gender, label: 'الجنس' },
  { id: DEFAULT_PROFILE_FIELD_IDS.country, label: 'الدولة' },
  { id: DEFAULT_PROFILE_FIELD_IDS.jobTitle, label: 'الصفة الوظيفية' },
  { id: DEFAULT_PROFILE_FIELD_IDS.specialty, label: 'التخصص' },
  { id: DEFAULT_PROFILE_FIELD_IDS.workplace, label: 'جهة العمل / المستشفى / الجامعة' },
  { id: DEFAULT_PROFILE_FIELD_IDS.professionalCardDocument, label: 'ملف بطاقة مزاولة المهنة' },
  { id: DEFAULT_PROFILE_FIELD_IDS.profileDeclaration, label: 'الإقرار بصحة البيانات' },
] as const;
