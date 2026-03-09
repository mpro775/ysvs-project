import { Injectable, BadRequestException } from '@nestjs/common';
import { FormField, FormFieldType } from '../schemas/event.schema';

const OTHER_OPTION_VALUE = '__other__';
const getOtherFieldId = (fieldId: string) => `${fieldId}__other`;

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

@Injectable()
export class FormValidatorService {
  validateFormData(
    formSchema: FormField[],
    formData: Record<string, unknown>,
  ): ValidationResult {
    const errors: ValidationError[] = [];

    for (const field of formSchema) {
      if (field.type === FormFieldType.SECTION) {
        continue;
      }

      const value = formData[field.id];
      const fieldErrors = this.validateField(field, value, formData);
      errors.push(...fieldErrors);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private validateField(
    field: FormField,
    value: unknown,
    formData: Record<string, unknown>,
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    const fieldLabel = field.label;

    if (field.type === FormFieldType.SECTION) {
      return errors;
    }

    // Check required
    if (field.required && this.isEmpty(value)) {
      errors.push({
        field: field.id,
        message: `${fieldLabel} مطلوب`,
      });
      return errors; // No need to validate further if required field is empty
    }

    // Skip validation if value is empty and field is not required
    if (this.isEmpty(value)) {
      return errors;
    }

    // Type-specific validation
    switch (field.type) {
      case FormFieldType.TEXT:
      case FormFieldType.TEXTAREA:
        errors.push(...this.validateText(field, value));
        break;

      case FormFieldType.EMAIL:
        errors.push(...this.validateEmail(field, value));
        break;

      case FormFieldType.PHONE:
        errors.push(...this.validatePhone(field, value));
        break;

      case FormFieldType.NUMBER:
        errors.push(...this.validateNumber(field, value));
        break;

      case FormFieldType.SELECT:
      case FormFieldType.RADIO:
        errors.push(...this.validateSelect(field, value, formData));
        break;

      case FormFieldType.MULTISELECT:
        errors.push(...this.validateMultiSelect(field, value));
        break;

      case FormFieldType.CHECKBOX:
        errors.push(...this.validateCheckbox(field, value));
        break;

      case FormFieldType.DATE:
        errors.push(...this.validateDate(field, value));
        break;

      case FormFieldType.FILE:
        errors.push(...this.validateFile(field, value));
        break;
    }

    return errors;
  }

  private validateText(field: FormField, value: unknown): ValidationError[] {
    const errors: ValidationError[] = [];
    const strValue = String(value);
    const validation = field.validation;

    if (validation?.minLength && strValue.length < validation.minLength) {
      errors.push({
        field: field.id,
        message: `${field.label} يجب أن يكون ${validation.minLength} أحرف على الأقل`,
      });
    }

    if (validation?.maxLength && strValue.length > validation.maxLength) {
      errors.push({
        field: field.id,
        message: `${field.label} يجب أن لا يتجاوز ${validation.maxLength} حرف`,
      });
    }

    if (validation?.pattern) {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(strValue)) {
        errors.push({
          field: field.id,
          message: `${field.label} لا يطابق النمط المطلوب`,
        });
      }
    }

    return errors;
  }

  private validateEmail(field: FormField, value: unknown): ValidationError[] {
    const errors: ValidationError[] = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(String(value))) {
      errors.push({
        field: field.id,
        message: `${field.label} غير صالح`,
      });
    }

    return errors;
  }

  private validatePhone(field: FormField, value: unknown): ValidationError[] {
    const errors: ValidationError[] = [];
    const normalizedValue = String(value ?? '')
      .trim()
      .replace(/[\s\-().]/g, '');

    // Yemen phone format support:
    // - Country code prefix: +967 or 967 (with 0-9 digits after it)
    // - Local numbers starting with 7 and length 3-9 digits
    const phoneRegex = /^(?:\+?967\d{0,9}|7\d{2,8})$/;

    if (!phoneRegex.test(normalizedValue)) {
      errors.push({
        field: field.id,
        message: `${field.label} غير صالح`,
      });
    }

    return errors;
  }

  private validateNumber(field: FormField, value: unknown): ValidationError[] {
    const errors: ValidationError[] = [];
    const numValue = Number(value);
    const validation = field.validation;

    if (isNaN(numValue)) {
      errors.push({
        field: field.id,
        message: `${field.label} يجب أن يكون رقماً`,
      });
      return errors;
    }

    if (validation?.min !== undefined && numValue < validation.min) {
      errors.push({
        field: field.id,
        message: `${field.label} يجب أن يكون ${validation.min} على الأقل`,
      });
    }

    if (validation?.max !== undefined && numValue > validation.max) {
      errors.push({
        field: field.id,
        message: `${field.label} يجب أن لا يتجاوز ${validation.max}`,
      });
    }

    return errors;
  }

  private validateSelect(
    field: FormField,
    value: unknown,
    formData: Record<string, unknown>,
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    if (String(value) === OTHER_OPTION_VALUE) {
      if (!field.allowOther) {
        errors.push({
          field: field.id,
          message: `${field.label} قيمة غير صالحة`,
        });
        return errors;
      }

      const otherFieldId = getOtherFieldId(field.id);
      const otherValue = String(formData[otherFieldId] || '').trim();
      if (!otherValue) {
        errors.push({
          field: otherFieldId,
          message: `يرجى كتابة قيمة "أخرى" لحقل ${field.label}`,
        });
      }

      return errors;
    }

    if (field.options && field.options.length > 0) {
      const validValues = field.options.map((opt) => opt.value);
      if (!validValues.includes(String(value))) {
        errors.push({
          field: field.id,
          message: `${field.label} قيمة غير صالحة`,
        });
      }
    }

    return errors;
  }

  private validateCheckbox(field: FormField, value: unknown): ValidationError[] {
    const errors: ValidationError[] = [];

    if (typeof value !== 'boolean') {
      errors.push({
        field: field.id,
        message: `${field.label} قيمة غير صالحة`,
      });
      return errors;
    }

    if (field.required && value !== true) {
      errors.push({
        field: field.id,
        message: `يجب الموافقة على ${field.label}`,
      });
    }

    return errors;
  }

  private validateMultiSelect(field: FormField, value: unknown): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!Array.isArray(value)) {
      errors.push({
        field: field.id,
        message: `${field.label} يجب أن يكون مصفوفة`,
      });
      return errors;
    }

    if (field.options && field.options.length > 0) {
      const validValues = field.options.map((opt) => opt.value);
      const invalidValues = value.filter((v) => !validValues.includes(String(v)));

      if (invalidValues.length > 0) {
        errors.push({
          field: field.id,
          message: `${field.label} يحتوي على قيم غير صالحة`,
        });
      }
    }

    return errors;
  }

  private validateDate(field: FormField, value: unknown): ValidationError[] {
    const errors: ValidationError[] = [];
    const dateValue = new Date(String(value));

    if (isNaN(dateValue.getTime())) {
      errors.push({
        field: field.id,
        message: `${field.label} تاريخ غير صالح`,
      });
    }

    return errors;
  }

  private validateFile(field: FormField, value: unknown): ValidationError[] {
    const errors: ValidationError[] = [];

    if (typeof value !== 'object' || value === null) {
      errors.push({
        field: field.id,
        message: `${field.label} ملف غير صالح`,
      });
      return errors;
    }

    const fileValue = value as {
      key?: unknown;
      url?: unknown;
      originalName?: unknown;
      size?: unknown;
      mimetype?: unknown;
    };

    if (!fileValue.key || !fileValue.url || !fileValue.originalName) {
      errors.push({
        field: field.id,
        message: `${field.label} بيانات الملف غير مكتملة`,
      });
    }

    const fileSize = Number(fileValue.size);
    if (isNaN(fileSize) || fileSize <= 0) {
      errors.push({
        field: field.id,
        message: `${field.label} حجم الملف غير صالح`,
      });
    }

    if (field.validation?.maxFileSize) {
      const maxBytes = field.validation.maxFileSize * 1024 * 1024;
      if (!isNaN(fileSize) && fileSize > maxBytes) {
        errors.push({
          field: field.id,
          message: `${field.label} يتجاوز الحجم الأقصى المسموح`,
        });
      }
    }

    if (field.validation?.fileTypes?.length) {
      const mimetype = String(fileValue.mimetype || '').toLowerCase();
      const originalName = String(fileValue.originalName || '').toLowerCase();
      const extension = originalName.includes('.')
        ? `.${originalName.split('.').pop()}`
        : '';

      const allowedTypes = field.validation.fileTypes.map((t) => t.toLowerCase());
      const isAllowed = allowedTypes.some((allowedType) => {
        if (allowedType.startsWith('.')) {
          return extension === allowedType;
        }
        return mimetype === allowedType;
      });

      if (!isAllowed) {
        errors.push({
          field: field.id,
          message: `${field.label} نوع الملف غير مسموح`,
        });
      }
    }

    return errors;
  }

  private isEmpty(value: unknown): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    if (Array.isArray(value) && value.length === 0) return true;
    return false;
  }

  validateAndThrow(
    formSchema: FormField[],
    formData: Record<string, unknown>,
  ): void {
    const result = this.validateFormData(formSchema, formData);

    if (!result.isValid) {
      const errorMessages = result.errors.map((e) => e.message).join('، ');
      throw new BadRequestException(errorMessages);
    }
  }
}
