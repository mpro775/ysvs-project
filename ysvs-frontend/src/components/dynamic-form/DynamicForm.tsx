import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRegisterEvent, useUploadRegistrationFile } from '@/api/hooks/useEvents';
import { InlineLoader } from '@/components/shared/LoadingSpinner';
import type { FormField, UploadedFormFile } from '@/types';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

const OTHER_OPTION_VALUE = '__other__';
const getOtherFieldId = (fieldId: string) => `${fieldId}__other`;

const PROFILE_FIELD_IDS = {
  fullNameAr: 'fullNameAr',
  fullNameEn: 'fullNameEn',
  email: 'email',
  phone: 'phone',
  gender: 'gender',
  country: 'country',
  jobTitle: 'jobTitle',
  specialty: 'specialty',
  workplace: 'workplace',
  professionalCardDocument: 'professionalCardDocument',
  profileDeclaration: 'profileDeclaration',
} as const;

const baseProfileFieldIds = new Set<string>(Object.values(PROFILE_FIELD_IDS));

const genderOptions = [
  { value: 'male', label: 'ذكر' },
  { value: 'female', label: 'أنثى' },
];

const jobTitleOptions = [
  { value: 'consultant', label: 'استشاري' },
  { value: 'specialist', label: 'أخصائي' },
  { value: 'resident', label: 'مقيم' },
  { value: 'general_practitioner', label: 'طبيب عام' },
  { value: 'student', label: 'طالب' },
  { value: 'nursing', label: 'تمريض' },
];

const specialtyOptions = [
  { value: 'vascular_surgery', label: 'جراحة الأوعية الدموية' },
  { value: 'cardiac_surgery', label: 'جراحة القلب' },
  { value: 'cardiology', label: 'أمراض القلب' },
  { value: 'anesthesia', label: 'التخدير' },
  { value: 'critical_care', label: 'العناية المركزة' },
];

const countryOptions = [
  { value: 'yemen', label: 'اليمن' },
  { value: 'saudi_arabia', label: 'السعودية' },
  { value: 'oman', label: 'عُمان' },
  { value: 'uae', label: 'الإمارات' },
  { value: 'qatar', label: 'قطر' },
  { value: 'kuwait', label: 'الكويت' },
  { value: 'bahrain', label: 'البحرين' },
  { value: 'egypt', label: 'مصر' },
  { value: 'jordan', label: 'الأردن' },
  { value: 'other_arab', label: 'دولة عربية أخرى' },
  { value: 'other', label: 'دولة أخرى' },
];

const buildBaseProfileFields = (isGuest: boolean): FormField[] => [
  {
    id: PROFILE_FIELD_IDS.fullNameAr,
    type: 'text',
    label: 'الاسم الكامل (عربي)',
    labelEn: 'Full Name (Arabic)',
    placeholder: 'د. أحمد محمد',
    required: true,
    order: 0,
    validation: { minLength: 3 },
  },
  {
    id: PROFILE_FIELD_IDS.fullNameEn,
    type: 'text',
    label: 'الاسم الكامل (إنجليزي)',
    labelEn: 'Full Name (English)',
    placeholder: 'Dr. Ahmed Mohammed',
    required: true,
    order: 1,
    validation: { minLength: 3 },
  },
  {
    id: PROFILE_FIELD_IDS.email,
    type: 'email',
    label: 'البريد الإلكتروني',
    labelEn: 'Email',
    placeholder: 'you@example.com',
    required: true,
    order: 2,
  },
  {
    id: PROFILE_FIELD_IDS.phone,
    type: 'phone',
    label: 'رقم الهاتف',
    labelEn: 'Phone',
    placeholder: '+967 xxx xxx xxx',
    required: true,
    order: 3,
  },
  {
    id: PROFILE_FIELD_IDS.gender,
    type: 'select',
    label: 'الجنس',
    labelEn: 'Gender',
    required: true,
    order: 4,
    options: genderOptions,
  },
  {
    id: PROFILE_FIELD_IDS.country,
    type: 'select',
    label: 'الدولة',
    labelEn: 'Country',
    required: true,
    order: 5,
    options: countryOptions,
    allowOther: true,
  },
  {
    id: PROFILE_FIELD_IDS.jobTitle,
    type: 'select',
    label: 'الصفة الوظيفية',
    labelEn: 'Job Title',
    required: true,
    order: 6,
    options: jobTitleOptions,
    allowOther: true,
  },
  {
    id: PROFILE_FIELD_IDS.specialty,
    type: 'select',
    label: 'التخصص',
    labelEn: 'Specialty',
    required: true,
    order: 7,
    options: specialtyOptions,
    allowOther: true,
  },
  {
    id: PROFILE_FIELD_IDS.workplace,
    type: 'text',
    label: 'جهة العمل / المستشفى / الجامعة',
    labelEn: 'Workplace / Hospital / University',
    placeholder: 'مستشفى الثورة العام',
    required: true,
    order: 8,
    validation: { minLength: 2 },
  },
  {
    id: PROFILE_FIELD_IDS.professionalCardDocument,
    type: 'file',
    label: 'رفع ملف بطاقة مزاولة المهنة',
    labelEn: 'Professional License Card Upload',
    required: isGuest,
    order: 9,
    validation: {
      fileTypes: ['.jpg', '.jpeg', '.png', '.pdf'],
      maxFileSize: 10,
    },
  },
  {
    id: PROFILE_FIELD_IDS.profileDeclaration,
    type: 'checkbox',
    label:
      'أقر بأن جميع البيانات المدخلة صحيحة، وأتحمل المسؤولية عن صحة المستند المرفوع.',
    labelEn: 'I confirm all provided data and uploaded document are correct.',
    required: isGuest,
    order: 10,
  },
];

interface DynamicFormProps {
  eventId: string;
  schema: FormField[];
  isAuthenticated: boolean;
  guestRegistrationEnabled: boolean;
}

// Build Zod schema dynamically
function buildValidationSchema(fields: FormField[]) {
  const shape: Record<string, z.ZodTypeAny> = {};

  fields.forEach((field) => {
    let validator: z.ZodTypeAny;

    switch (field.type) {
      case 'email':
        validator = z.string().email('البريد الإلكتروني غير صالح');
        break;
      case 'section':
        validator = z.any().optional();
        break;
      case 'number':
        validator = z.coerce.number();
        if (field.validation?.min !== undefined) {
          validator = (validator as z.ZodNumber).min(
            field.validation.min,
            `القيمة يجب أن تكون ${field.validation.min} على الأقل`
          );
        }
        if (field.validation?.max !== undefined) {
          validator = (validator as z.ZodNumber).max(
            field.validation.max,
            `القيمة يجب ألا تتجاوز ${field.validation.max}`
          );
        }
        break;
      case 'checkbox':
        validator = z.boolean().refine((checked) => (field.required ? checked : true), {
          message: 'يجب الموافقة على هذا الإقرار',
        });
        break;
      case 'multiselect':
        validator = z.array(z.string());
        break;
      case 'file':
        validator = z.object({
          key: z.string().min(1),
          url: z.string().min(1),
          originalName: z.string().min(1),
          size: z.number().positive(),
          mimetype: z.string().min(1),
        });
        break;
      default:
        validator = z.string();
        if (field.validation?.minLength) {
          validator = (validator as z.ZodString).min(
            field.validation.minLength,
            `الحد الأدنى ${field.validation.minLength} حرف`
          );
        }
        if (field.validation?.maxLength) {
          validator = (validator as z.ZodString).max(
            field.validation.maxLength,
            `الحد الأقصى ${field.validation.maxLength} حرف`
          );
        }
        if (field.validation?.pattern) {
          validator = (validator as z.ZodString).regex(
            new RegExp(field.validation.pattern),
            'القيمة غير صالحة'
          );
        }
    }

    if (!field.required) {
      validator = validator.optional();
    }

    shape[field.id] = validator;

    if ((field.type === 'select' || field.type === 'radio') && field.allowOther) {
      shape[getOtherFieldId(field.id)] = z.string().optional();
    }
  });

  return z.object(shape).superRefine((values, ctx) => {
    fields.forEach((field) => {
      if ((field.type === 'select' || field.type === 'radio') && field.allowOther) {
        const selectedValue = values[field.id];
        if (selectedValue === OTHER_OPTION_VALUE) {
          const otherFieldId = getOtherFieldId(field.id);
          const otherValue = String(values[otherFieldId] || '').trim();

          if (!otherValue) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [otherFieldId],
              message: `يرجى كتابة قيمة "أخرى" لحقل ${field.label}`,
            });
          }
        }
      }
    });
  });
}

// Render field based on type
function renderField(
  field: FormField,
  value: unknown,
  onChange: (value: unknown) => void,
  error?: string,
  otherValue?: string,
  onOtherChange?: (value: string) => void,
  otherError?: string
) {
  const isLtrField = field.type === 'email' || field.type === 'phone';
  const commonProps = {
    id: field.id,
    placeholder: field.placeholder,
    dir: isLtrField ? 'ltr' : 'rtl',
    className: `${error ? 'border-destructive ' : ''}${isLtrField ? 'text-left' : 'text-right'}`,
  };

  switch (field.type) {
    case 'textarea':
      return (
        <Textarea
          {...commonProps}
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
        />
      );

    case 'select':
      return (
        <div className="space-y-2">
          <Select value={(value as string) || ''} onValueChange={onChange}>
            <SelectTrigger className={`${error ? 'border-destructive ' : ''}text-right`} dir="rtl">
              <SelectValue placeholder={field.placeholder || 'اختر...'} />
            </SelectTrigger>
            <SelectContent dir="rtl">
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
              {field.allowOther && <SelectItem value={OTHER_OPTION_VALUE}>أخرى</SelectItem>}
            </SelectContent>
          </Select>
          {field.allowOther && value === OTHER_OPTION_VALUE && (
            <>
              <Input
                id={getOtherFieldId(field.id)}
                value={otherValue || ''}
                onChange={(event) => onOtherChange?.(event.target.value)}
                placeholder="اكتب قيمة أخرى"
                dir="rtl"
                className={`${otherError ? 'border-destructive ' : ''}text-right`}
              />
              {otherError && <p className="text-sm text-destructive">{otherError}</p>}
            </>
          )}
        </div>
      );

    case 'multiselect':
      return (
        <div className="space-y-2">
          {field.options?.map((option) => (
            <div key={option.value} className="flex flex-row-reverse items-center justify-end gap-2 text-right">
              <Checkbox
                id={`${field.id}-${option.value}`}
                checked={(value as string[] || []).includes(option.value)}
                onCheckedChange={(checked) => {
                  const currentValue = (value as string[]) || [];
                  if (checked) {
                    onChange([...currentValue, option.value]);
                  } else {
                    onChange(currentValue.filter((v) => v !== option.value));
                  }
                }}
              />
              <Label htmlFor={`${field.id}-${option.value}`}>{option.label}</Label>
            </div>
          ))}
        </div>
      );

    case 'checkbox':
      return (
        <div className="flex flex-row-reverse items-center justify-end gap-2 text-right">
          <Checkbox
            id={field.id}
            checked={(value as boolean) || false}
            onCheckedChange={onChange}
          />
          <Label htmlFor={field.id}>{field.label}</Label>
        </div>
      );

    case 'radio':
      return (
        <div className="space-y-2">
          <RadioGroup value={(value as string) || ''} onValueChange={onChange} dir="rtl">
            {field.options?.map((option) => (
              <div key={option.value} className="flex flex-row-reverse items-center justify-end gap-2 text-right">
                <RadioGroupItem value={option.value} id={`${field.id}-${option.value}`} />
                <Label htmlFor={`${field.id}-${option.value}`}>{option.label}</Label>
              </div>
            ))}
            {field.allowOther && (
              <div className="flex flex-row-reverse items-center justify-end gap-2 text-right">
                <RadioGroupItem value={OTHER_OPTION_VALUE} id={`${field.id}-${OTHER_OPTION_VALUE}`} />
                <Label htmlFor={`${field.id}-${OTHER_OPTION_VALUE}`}>أخرى</Label>
              </div>
            )}
          </RadioGroup>
          {field.allowOther && value === OTHER_OPTION_VALUE && (
            <>
              <Input
                id={getOtherFieldId(field.id)}
                value={otherValue || ''}
                onChange={(event) => onOtherChange?.(event.target.value)}
                placeholder="اكتب قيمة أخرى"
                dir="rtl"
                className={`${otherError ? 'border-destructive ' : ''}text-right`}
              />
              {otherError && <p className="text-sm text-destructive">{otherError}</p>}
            </>
          )}
        </div>
      );

    case 'file':
      return (
        <Input
          {...commonProps}
          type="file"
          accept={field.validation?.fileTypes?.join(',')}
          onChange={(e) => onChange(e.target.files?.[0])}
        />
      );

    case 'date':
      return (
        <Input
          {...commonProps}
          type="date"
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'email':
      return (
        <Input
          {...commonProps}
          type="email"
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'phone':
      return (
        <Input
          {...commonProps}
          type="tel"
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'number':
      return (
        <Input
          {...commonProps}
          type="number"
          min={field.validation?.min}
          max={field.validation?.max}
          value={(value as number) || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    default:
      return (
        <Input
          {...commonProps}
          type="text"
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

export function DynamicForm({
  eventId,
  schema,
  isAuthenticated,
  guestRegistrationEnabled,
}: DynamicFormProps) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [uploadingFieldId, setUploadingFieldId] = useState<string | null>(null);
  const { mutate: registerEvent, isPending } = useRegisterEvent();
  const { mutateAsync: uploadRegistrationFile } = useUploadRegistrationFile();

  const isGuest = guestRegistrationEnabled && !isAuthenticated;
  const sortedSchema = [...schema].sort((a, b) => a.order - b.order);
  const baseProfileFields = useMemo(() => buildBaseProfileFields(isGuest), [isGuest]);
  const eventSpecificSchema = useMemo(
    () => sortedSchema.filter((field) => !baseProfileFieldIds.has(field.id)),
    [sortedSchema],
  );
  const allFields = useMemo(
    () => [...baseProfileFields, ...eventSpecificSchema],
    [baseProfileFields, eventSpecificSchema],
  );
  const validationSchema = useMemo(() => buildValidationSchema(allFields), [allFields]);
  const sectionOrdinals = [
    'أولاً',
    'ثانياً',
    'ثالثاً',
    'رابعاً',
    'خامساً',
    'سادساً',
    'سابعاً',
    'ثامناً',
    'تاسعاً',
    'عاشراً',
  ];

  const {
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<Record<string, unknown>>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      [PROFILE_FIELD_IDS.fullNameAr]: user?.fullNameAr || '',
      [PROFILE_FIELD_IDS.fullNameEn]: user?.fullNameEn || '',
      [PROFILE_FIELD_IDS.email]: user?.email || '',
      [PROFILE_FIELD_IDS.phone]: user?.phone || '',
      [PROFILE_FIELD_IDS.gender]: user?.gender || '',
      [PROFILE_FIELD_IDS.workplace]: user?.workplace || '',
      [PROFILE_FIELD_IDS.profileDeclaration]: false,
    },
  });

  const mapSelectFieldDefault = (
    fieldId:
      | typeof PROFILE_FIELD_IDS.country
      | typeof PROFILE_FIELD_IDS.jobTitle
      | typeof PROFILE_FIELD_IDS.specialty,
    value: string | undefined,
    options: Array<{ value: string }>,
  ) => {
    if (!value?.trim()) {
      return;
    }

    const normalized = value.trim();
    const hasOption = options.some((option) => option.value === normalized);
    if (hasOption) {
      setValue(fieldId, normalized, { shouldDirty: false });
      return;
    }

    setValue(fieldId, OTHER_OPTION_VALUE, { shouldDirty: false });
    setValue(getOtherFieldId(fieldId), normalized, { shouldDirty: false });
  };

  useEffect(() => {
    mapSelectFieldDefault(PROFILE_FIELD_IDS.country, user?.country, countryOptions);
    mapSelectFieldDefault(PROFILE_FIELD_IDS.jobTitle, user?.jobTitle, jobTitleOptions);
    mapSelectFieldDefault(PROFILE_FIELD_IDS.specialty, user?.specialty, specialtyOptions);
  }, [user?.country, user?.jobTitle, user?.specialty]);

  const validateSelectedFile = (field: FormField, file: File): string | null => {
    const allowedTypes = field.validation?.fileTypes;

    if (allowedTypes?.length) {
      const extension = `.${file.name.split('.').pop()?.toLowerCase() || ''}`;
      const normalizedMime = file.type.toLowerCase();
      const isAllowed = allowedTypes.some((type) => {
        const normalizedType = type.trim().toLowerCase();
        if (normalizedType.startsWith('.')) {
          return extension === normalizedType;
        }
        return normalizedMime === normalizedType;
      });

      if (!isAllowed) {
        return 'نوع الملف غير مسموح';
      }
    }

    if (field.validation?.maxFileSize) {
      const maxBytes = field.validation.maxFileSize * 1024 * 1024;
      if (file.size > maxBytes) {
        return `حجم الملف يجب ألا يتجاوز ${field.validation.maxFileSize}MB`;
      }
    }

    return null;
  };

  const handleFileUpload = async (field: FormField, file?: File) => {
    if (!file) {
      return;
    }

    const validationError = validateSelectedFile(field, file);
    if (validationError) {
      setError(field.id, { type: 'manual', message: validationError });
      return;
    }

    setUploadingFieldId(field.id);
    clearErrors(field.id);

    try {
      const uploadedFile = await uploadRegistrationFile({
        eventId,
        fieldId: field.id,
        file,
      });

      setValue(field.id, uploadedFile, { shouldValidate: true, shouldDirty: true });
      clearErrors(field.id);
    } catch (error) {
      setError(field.id, {
        type: 'manual',
        message:
          error instanceof Error
            ? error.message
            : 'فشل رفع الملف، حاول مرة أخرى',
      });
    } finally {
      setUploadingFieldId(null);
    }
  };

  const onSubmit = (data: Record<string, unknown>) => {
    const normalizedGuestEmail =
      isGuest && typeof data.email === 'string'
        ? data.email.trim().toLowerCase()
        : undefined;

    for (const field of allFields) {
      if ((field.type === 'select' || field.type === 'radio') && field.allowOther) {
        const selectedValue = data[field.id];
        if (selectedValue === OTHER_OPTION_VALUE) {
          const otherFieldId = getOtherFieldId(field.id);
          data[otherFieldId] = String(data[otherFieldId] || '').trim();
        }
      }
    }

    registerEvent(
      {
        eventId,
        data,
        guestEmail: normalizedGuestEmail,
      },
      {
        onSuccess: () => {
          navigate(isAuthenticated ? '/member/events' : '/events');
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 text-right" dir="rtl">
      {!isGuest && (
        <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
          تم تعبئة البيانات الأساسية من حسابك تلقائياً، ويمكنك تعديلها قبل إرسال التسجيل.
          {user?.fullNameAr ? ` (${user.fullNameAr})` : ''}
          .
        </div>
      )}

      <div className="space-y-4 rounded-lg border p-4">
        <p className="text-sm font-semibold">
          {isGuest ? 'البيانات الأساسية للضيف' : 'البيانات الأساسية للتسجيل'}
        </p>
        <p className="text-xs text-muted-foreground">
          تشمل هذه البيانات: الاسم عربي/إنجليزي، الهاتف، البريد، الجنس، الدولة، الصفة الوظيفية، التخصص، جهة العمل.
        </p>
      </div>

      {allFields.map((field, index) => {
        const value = watch(field.id);
        const error = errors[field.id]?.message as string | undefined;
        const otherFieldId = getOtherFieldId(field.id);
        const otherValue = watch(otherFieldId) as string | undefined;
        const otherError = errors[otherFieldId]?.message as string | undefined;

        if (field.type === 'section') {
          const sectionNumber =
            allFields.slice(0, index + 1).filter((item) => item.type === 'section').length;
          const prefix =
            sectionOrdinals[sectionNumber - 1] || `${sectionNumber}.`;

          return (
            <div key={field.id} className="rounded-lg border bg-muted/30 p-4 text-right">
              <h3 className="font-semibold">{`${prefix}: ${field.label}`}</h3>
              {field.placeholder && (
                <p className="mt-1 text-sm text-muted-foreground">{field.placeholder}</p>
              )}
            </div>
          );
        }

        // Skip rendering label for checkbox (it's inline)
        if (field.type === 'checkbox') {
          return (
            <div key={field.id}>
              {renderField(field, value, (v) => setValue(field.id, v), error)}
              {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
            </div>
          );
        }

        return (
          <div key={field.id} className="space-y-2 text-right">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="ml-1 text-destructive">*</span>}
            </Label>
            {field.id === PROFILE_FIELD_IDS.professionalCardDocument && (
              <p className="text-xs text-muted-foreground">
                يشترط أن تكون البطاقة واضحة وسارية المفعول. الصيغ المسموحة: صورة أو PDF.
              </p>
            )}
            {renderField(
              field,
              value,
              (v) => {
                if (field.type === 'file') {
                  void handleFileUpload(field, v as File | undefined);
                  return;
                }

                setValue(field.id, v, { shouldValidate: true, shouldDirty: true });

                if ((field.type === 'select' || field.type === 'radio') && v !== OTHER_OPTION_VALUE) {
                  setValue(otherFieldId, '', { shouldValidate: true, shouldDirty: true });
                  clearErrors(otherFieldId);
                }
              },
              error,
              otherValue,
              (v) => setValue(otherFieldId, v, { shouldValidate: true, shouldDirty: true }),
              otherError,
            )}
            {field.type === 'file' && uploadingFieldId === field.id && (
              <p className="text-sm text-muted-foreground">جاري رفع الملف...</p>
            )}
            {field.type === 'file' && Boolean(value) && typeof value === 'object' && (
              <a
                href={(value as UploadedFormFile).url}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-primary-700 underline"
              >
                تم رفع الملف: {(value as UploadedFormFile).originalName}
              </a>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );
      })}

      <Button
        type="submit"
        className="w-full"
        disabled={isPending || uploadingFieldId !== null}
      >
        {isPending && <InlineLoader className="ml-2" />}
        {isPending ? 'جاري إرسال التسجيل...' : 'إرسال التسجيل'}
      </Button>
    </form>
  );
}
