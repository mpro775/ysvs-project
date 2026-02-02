import { Injectable, BadRequestException } from '@nestjs/common';
import { FormField, FormFieldType } from '../schemas/event.schema';

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
      const value = formData[field.id];
      const fieldErrors = this.validateField(field, value);
      errors.push(...fieldErrors);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private validateField(field: FormField, value: unknown): ValidationError[] {
    const errors: ValidationError[] = [];
    const fieldLabel = field.label;

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
        errors.push(...this.validateSelect(field, value));
        break;

      case FormFieldType.MULTISELECT:
      case FormFieldType.CHECKBOX:
        errors.push(...this.validateMultiSelect(field, value));
        break;

      case FormFieldType.DATE:
        errors.push(...this.validateDate(field, value));
        break;

      case FormFieldType.FILE:
        // File validation is handled separately during upload
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
    const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;

    if (!phoneRegex.test(String(value))) {
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

  private validateSelect(field: FormField, value: unknown): ValidationError[] {
    const errors: ValidationError[] = [];

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
