import { X, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { FormField, FormFieldOption } from '@/types';

interface FieldEditorProps {
  field: FormField;
  onChange: (field: FormField) => void;
  onClose: () => void;
}

export function FieldEditor({ field, onChange, onClose }: FieldEditorProps) {
  const hasOptions = ['select', 'multiselect', 'radio'].includes(field.type);
  const hasValidation = ['text', 'textarea', 'number', 'file'].includes(field.type);

  const updateField = (updates: Partial<FormField>) => {
    onChange({ ...field, ...updates });
  };

  const addOption = () => {
    const newOptions = [
      ...(field.options || []),
      { value: `option${(field.options?.length || 0) + 1}`, label: 'خيار جديد' },
    ];
    updateField({ options: newOptions });
  };

  const updateOption = (index: number, updates: Partial<FormFieldOption>) => {
    const newOptions = field.options?.map((opt, i) =>
      i === index ? { ...opt, ...updates } : opt
    );
    updateField({ options: newOptions });
  };

  const removeOption = (index: number) => {
    const newOptions = field.options?.filter((_, i) => i !== index);
    updateField({ options: newOptions });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm">خصائص الحقل</CardTitle>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Properties */}
        <div className="space-y-2">
          <Label htmlFor="label">العنوان (عربي)</Label>
          <Input
            id="label"
            value={field.label}
            onChange={(e) => updateField({ label: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="labelEn">العنوان (إنجليزي)</Label>
          <Input
            id="labelEn"
            dir="ltr"
            value={field.labelEn}
            onChange={(e) => updateField({ labelEn: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="placeholder">النص التوضيحي</Label>
          <Input
            id="placeholder"
            value={field.placeholder || ''}
            onChange={(e) => updateField({ placeholder: e.target.value })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="required">حقل إجباري</Label>
          <Switch
            id="required"
            checked={field.required}
            onCheckedChange={(checked) => updateField({ required: checked })}
          />
        </div>

        {/* Options (for select, multiselect, radio) */}
        {hasOptions && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>الخيارات</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                >
                  <Plus className="ml-1 h-3 w-3" />
                  إضافة
                </Button>
              </div>
              <div className="space-y-2">
                {field.options?.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={option.label}
                      onChange={(e) =>
                        updateOption(index, {
                          label: e.target.value,
                          value: e.target.value.toLowerCase().replace(/\s+/g, '_'),
                        })
                      }
                      placeholder="نص الخيار"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => removeOption(index)}
                      disabled={(field.options?.length || 0) <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Validation */}
        {hasValidation && (
          <>
            <Separator />
            <div className="space-y-3">
              <Label>التحقق</Label>

              {(field.type === 'text' || field.type === 'textarea') && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="minLength" className="text-xs">
                      الحد الأدنى
                    </Label>
                    <Input
                      id="minLength"
                      type="number"
                      min={0}
                      value={field.validation?.minLength || ''}
                      onChange={(e) =>
                        updateField({
                          validation: {
                            ...field.validation,
                            minLength: e.target.value ? parseInt(e.target.value) : undefined,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="maxLength" className="text-xs">
                      الحد الأقصى
                    </Label>
                    <Input
                      id="maxLength"
                      type="number"
                      min={0}
                      value={field.validation?.maxLength || ''}
                      onChange={(e) =>
                        updateField({
                          validation: {
                            ...field.validation,
                            maxLength: e.target.value ? parseInt(e.target.value) : undefined,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              )}

              {field.type === 'number' && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="min" className="text-xs">
                      الحد الأدنى
                    </Label>
                    <Input
                      id="min"
                      type="number"
                      value={field.validation?.min || ''}
                      onChange={(e) =>
                        updateField({
                          validation: {
                            ...field.validation,
                            min: e.target.value ? parseInt(e.target.value) : undefined,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="max" className="text-xs">
                      الحد الأقصى
                    </Label>
                    <Input
                      id="max"
                      type="number"
                      value={field.validation?.max || ''}
                      onChange={(e) =>
                        updateField({
                          validation: {
                            ...field.validation,
                            max: e.target.value ? parseInt(e.target.value) : undefined,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              )}

              {field.type === 'file' && (
                <>
                  <div className="space-y-1">
                    <Label htmlFor="fileTypes" className="text-xs">
                      أنواع الملفات المسموحة
                    </Label>
                    <Input
                      id="fileTypes"
                      placeholder=".pdf,.doc,.docx"
                      value={field.validation?.fileTypes?.join(',') || ''}
                      onChange={(e) =>
                        updateField({
                          validation: {
                            ...field.validation,
                            fileTypes: e.target.value
                              ? e.target.value.split(',').map((t) => t.trim())
                              : undefined,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="maxFileSize" className="text-xs">
                      الحد الأقصى للحجم (MB)
                    </Label>
                    <Input
                      id="maxFileSize"
                      type="number"
                      min={1}
                      value={field.validation?.maxFileSize || ''}
                      onChange={(e) =>
                        updateField({
                          validation: {
                            ...field.validation,
                            maxFileSize: e.target.value ? parseInt(e.target.value) : undefined,
                          },
                        })
                      }
                    />
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
