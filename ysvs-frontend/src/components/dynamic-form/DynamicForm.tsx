import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
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

const OTHER_OPTION_VALUE = '__other__';
const getOtherFieldId = (fieldId: string) => `${fieldId}__other`;

interface DynamicFormProps {
  eventId: string;
  schema: FormField[];
  isAuthenticated: boolean;
  guestRegistrationEnabled: boolean;
  guestEmailMode: 'required' | 'optional';
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
  guestEmailMode,
}: DynamicFormProps) {
  const navigate = useNavigate();
  const [uploadingFieldId, setUploadingFieldId] = useState<string | null>(null);
  const [guestEmail, setGuestEmail] = useState('');
  const [guestEmailError, setGuestEmailError] = useState<string | null>(null);
  const { mutate: registerEvent, isPending } = useRegisterEvent();
  const { mutateAsync: uploadRegistrationFile } = useUploadRegistrationFile();

  const sortedSchema = [...schema].sort((a, b) => a.order - b.order);
  const validationSchema = buildValidationSchema(sortedSchema);
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
  } = useForm({
    resolver: zodResolver(validationSchema),
  });

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
    const isGuest = guestRegistrationEnabled && !isAuthenticated;
    const normalizedGuestEmail = guestEmail.trim().toLowerCase();

    if (isGuest) {
      const isRequired = guestEmailMode === 'required';
      if (isRequired && !normalizedGuestEmail) {
        setGuestEmailError('البريد الإلكتروني مطلوب للتسجيل كضيف');
        return;
      }

      if (normalizedGuestEmail) {
        const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedGuestEmail);
        if (!isValidEmail) {
          setGuestEmailError('يرجى إدخال بريد إلكتروني صالح');
          return;
        }
      }
    }

    for (const field of sortedSchema) {
      if ((field.type === 'select' || field.type === 'radio') && field.allowOther) {
        const selectedValue = data[field.id];
        if (selectedValue === OTHER_OPTION_VALUE) {
          const otherFieldId = getOtherFieldId(field.id);
          data[otherFieldId] = String(data[otherFieldId] || '').trim();
        }
      }
    }

    setGuestEmailError(null);
    registerEvent(
      {
        eventId,
        data,
        guestEmail:
          isGuest && normalizedGuestEmail.length > 0
            ? normalizedGuestEmail
            : undefined,
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
      {guestRegistrationEnabled && !isAuthenticated && (
        <div className="space-y-2 text-right">
          <Label htmlFor="guest-email">
            البريد الإلكتروني
            {guestEmailMode === 'required' && (
              <span className="ml-1 text-destructive">*</span>
            )}
          </Label>
          <Input
            id="guest-email"
            type="email"
            dir="ltr"
            value={guestEmail}
            onChange={(event) => {
              setGuestEmail(event.target.value);
              if (guestEmailError) {
                setGuestEmailError(null);
              }
            }}
            className={guestEmailError ? 'border-destructive' : ''}
            placeholder="you@example.com"
          />
          {guestEmailError && (
            <p className="text-sm text-destructive">{guestEmailError}</p>
          )}
        </div>
      )}

      {sortedSchema.map((field, index) => {
        const value = watch(field.id);
        const error = errors[field.id]?.message as string | undefined;
        const otherFieldId = getOtherFieldId(field.id);
        const otherValue = watch(otherFieldId) as string | undefined;
        const otherError = errors[otherFieldId]?.message as string | undefined;

        if (field.type === 'section') {
          const sectionNumber =
            sortedSchema.slice(0, index + 1).filter((item) => item.type === 'section').length;
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
