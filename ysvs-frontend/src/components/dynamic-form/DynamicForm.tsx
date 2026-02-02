import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
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
import { useRegisterEvent } from '@/api/hooks/useEvents';
import type { FormField } from '@/types';
import { useNavigate } from 'react-router-dom';

interface DynamicFormProps {
  eventId: string;
  schema: FormField[];
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
        validator = z.boolean();
        break;
      case 'multiselect':
        validator = z.array(z.string());
        break;
      case 'file':
        validator = z.any();
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
  });

  return z.object(shape);
}

// Render field based on type
function renderField(
  field: FormField,
  value: unknown,
  onChange: (value: unknown) => void,
  error?: string
) {
  const commonProps = {
    id: field.id,
    placeholder: field.placeholder,
    className: error ? 'border-destructive' : '',
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
        <Select value={(value as string) || ''} onValueChange={onChange}>
          <SelectTrigger className={error ? 'border-destructive' : ''}>
            <SelectValue placeholder={field.placeholder || 'اختر...'} />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case 'multiselect':
      return (
        <div className="space-y-2">
          {field.options?.map((option) => (
            <div key={option.value} className="flex items-center gap-2">
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
        <div className="flex items-center gap-2">
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
        <RadioGroup value={(value as string) || ''} onValueChange={onChange}>
          {field.options?.map((option) => (
            <div key={option.value} className="flex items-center gap-2">
              <RadioGroupItem value={option.value} id={`${field.id}-${option.value}`} />
              <Label htmlFor={`${field.id}-${option.value}`}>{option.label}</Label>
            </div>
          ))}
        </RadioGroup>
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
          dir="ltr"
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'phone':
      return (
        <Input
          {...commonProps}
          type="tel"
          dir="ltr"
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

export function DynamicForm({ eventId, schema }: DynamicFormProps) {
  const navigate = useNavigate();
  const { mutate: registerEvent, isPending } = useRegisterEvent();

  const sortedSchema = [...schema].sort((a, b) => a.order - b.order);
  const validationSchema = buildValidationSchema(sortedSchema);

  const {
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(validationSchema),
  });

  const onSubmit = (data: Record<string, unknown>) => {
    registerEvent(
      { eventId, data },
      {
        onSuccess: () => {
          navigate('/member/events');
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {sortedSchema.map((field) => {
        const value = watch(field.id);
        const error = errors[field.id]?.message as string | undefined;

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
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="mr-1 text-destructive">*</span>}
            </Label>
            {renderField(field, value, (v) => setValue(field.id, v), error)}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );
      })}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
        إرسال التسجيل
      </Button>
    </form>
  );
}
