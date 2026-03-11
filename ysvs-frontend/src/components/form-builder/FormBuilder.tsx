import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FieldPalette } from './FieldPalette';
import { SortableField } from './SortableField';
import { FieldEditor } from './FieldEditor';
import type { FormField, FormFieldType } from '@/types';

interface FormBuilderProps {
  initialSchema?: FormField[];
  onChange: (schema: FormField[]) => void;
}

// Generate UUID manually if uuid is not available
function generateId(): string {
  return 'field_' + Math.random().toString(36).substr(2, 9);
}

export function FormBuilder({ initialSchema = [], onChange }: FormBuilderProps) {
  const [fields, setFields] = useState<FormField[]>(initialSchema);
  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  const [showPalette, setShowPalette] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const updateFields = (newFields: FormField[]) => {
    setFields(newFields);
    onChange(newFields);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id);
      const newIndex = fields.findIndex((f) => f.id === over.id);

      const newFields = arrayMove(fields, oldIndex, newIndex).map((f, i) => ({
        ...f,
        order: i,
      }));

      updateFields(newFields);
    }
  };

  const addField = (type: FormFieldType) => {
    const newField: FormField = {
      id: generateId(),
      type,
      label: getDefaultLabel(type),
      labelEn: getDefaultLabelEn(type),
      required: false,
      order: fields.length,
      options: type === 'select' || type === 'multiselect' || type === 'radio'
        ? [{ value: 'option1', label: 'خيار 1' }]
        : undefined,
    };

    updateFields([...fields, newField]);
    setSelectedField(newField);
    setShowPalette(false);
  };

  const updateField = (updatedField: FormField) => {
    const newFields = fields.map((f) =>
      f.id === updatedField.id ? updatedField : f
    );
    updateFields(newFields);
    setSelectedField(updatedField);
  };

  const deleteField = (fieldId: string) => {
    const newFields = fields
      .filter((f) => f.id !== fieldId)
      .map((f, i) => ({ ...f, order: i }));
    updateFields(newFields);
    if (selectedField?.id === fieldId) {
      setSelectedField(null);
    }
  };

  const duplicateField = (field: FormField) => {
    const newField: FormField = {
      ...field,
      id: generateId(),
      label: field.label + ' (نسخة)',
      order: fields.length,
    };
    updateFields([...fields, newField]);
  };

  const applyTemplate = (template: 'doctor' | 'nurse' | 'student') => {
    const templateFields = buildTemplateFields(template);
    updateFields(templateFields);
    setSelectedField(templateFields[0] || null);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Fields List */}
      <div className="lg:col-span-2">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-medium">حقول النموذج ({fields.length})</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowPalette(!showPalette)}
          >
            <Plus className="ml-2 h-4 w-4" />
            إضافة حقل
          </Button>
        </div>

        {fields.length === 0 && (
          <div className="mb-4 rounded-lg border p-3">
            <p className="mb-2 text-sm font-medium">قوالب جاهزة سريعة</p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => applyTemplate('doctor')}>
                قالب الأطباء
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => applyTemplate('nurse')}>
                قالب التمريض
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => applyTemplate('student')}>
                قالب الطلاب
              </Button>
            </div>
          </div>
        )}

        {showPalette && (
          <div className="mb-4">
            <FieldPalette onSelect={addField} onClose={() => setShowPalette(false)} />
          </div>
        )}

        {fields.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed p-8 text-center">
            <p className="text-muted-foreground">
              لا توجد حقول. اضغط على "إضافة حقل" لبدء بناء النموذج.
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={fields.map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {fields.map((field) => (
                  <SortableField
                    key={field.id}
                    field={field}
                    isSelected={selectedField?.id === field.id}
                    onSelect={() => setSelectedField(field)}
                    onDelete={() => deleteField(field.id)}
                    onDuplicate={() => duplicateField(field)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Field Editor */}
      <div>
        {selectedField ? (
          <FieldEditor
            field={selectedField}
            onChange={updateField}
            onClose={() => setSelectedField(null)}
          />
        ) : (
          <div className="rounded-lg border p-4 text-center text-muted-foreground">
            اختر حقلاً لتعديل خصائصه
          </div>
        )}
      </div>
    </div>
  );
}

function getDefaultLabel(type: FormFieldType): string {
  const labels: Record<FormFieldType, string> = {
    section: 'عنوان قسم',
    text: 'حقل نصي',
    textarea: 'نص طويل',
    select: 'قائمة منسدلة',
    multiselect: 'اختيار متعدد',
    checkbox: 'مربع اختيار',
    radio: 'اختيار واحد',
    file: 'رفع ملف',
    date: 'تاريخ',
    email: 'بريد إلكتروني',
    phone: 'رقم هاتف',
    number: 'رقم',
  };
  return labels[type] || 'حقل';
}

function getDefaultLabelEn(type: FormFieldType): string {
  const labels: Record<FormFieldType, string> = {
    section: 'Section Header',
    text: 'Text Field',
    textarea: 'Long Text',
    select: 'Dropdown',
    multiselect: 'Multi Select',
    checkbox: 'Checkbox',
    radio: 'Radio',
    file: 'File Upload',
    date: 'Date',
    email: 'Email',
    phone: 'Phone',
    number: 'Number',
  };
  return labels[type] || 'Field';
}

function buildTemplateFields(template: 'doctor' | 'nurse' | 'student'): FormField[] {
  if (template === 'doctor') {
    return [
      {
        id: generateId(),
        type: 'select',
        label: 'المجال الطبي الدقيق',
        labelEn: 'Sub-specialty',
        required: true,
        order: 0,
        options: [
          { value: 'vascular_surgery', label: 'جراحة الأوعية' },
          { value: 'interventional_radiology', label: 'الأشعة التداخلية' },
          { value: 'cardiology', label: 'القلب والأوعية' },
        ],
      },
      {
        id: generateId(),
        type: 'radio',
        label: 'سنوات الخبرة',
        labelEn: 'Years of Experience',
        required: true,
        order: 1,
        options: [
          { value: 'lt3', label: 'أقل من 3 سنوات' },
          { value: '3to7', label: '3-7 سنوات' },
          { value: 'gt7', label: 'أكثر من 7 سنوات' },
        ],
      },
      {
        id: generateId(),
        type: 'checkbox',
        label: 'أوافق على الالتزام بالحضور الكامل للجلسات',
        labelEn: 'I commit to full attendance',
        required: true,
        order: 2,
      },
    ];
  }

  if (template === 'nurse') {
    return [
      {
        id: generateId(),
        type: 'select',
        label: 'قسم التمريض',
        labelEn: 'Nursing Department',
        required: true,
        order: 0,
        options: [
          { value: 'icu', label: 'العناية المركزة' },
          { value: 'or', label: 'غرفة العمليات' },
          { value: 'ward', label: 'الأقسام الداخلية' },
        ],
      },
      {
        id: generateId(),
        type: 'text',
        label: 'جهة العمل',
        labelEn: 'Workplace',
        required: true,
        order: 1,
      },
      {
        id: generateId(),
        type: 'radio',
        label: 'سنوات الخبرة',
        labelEn: 'Years of Experience',
        required: true,
        order: 2,
        options: [
          { value: 'lt2', label: 'أقل من سنتين' },
          { value: '2to5', label: '2-5 سنوات' },
          { value: 'gt5', label: 'أكثر من 5 سنوات' },
        ],
      },
    ];
  }

  return [
    {
      id: generateId(),
      type: 'select',
      label: 'التخصص الدراسي',
      labelEn: 'Academic Program',
      required: true,
      order: 0,
      options: [
        { value: 'medicine', label: 'طب بشري' },
        { value: 'nursing', label: 'تمريض' },
        { value: 'allied_health', label: 'علوم صحية' },
      ],
    },
    {
      id: generateId(),
      type: 'text',
      label: 'الجامعة',
      labelEn: 'University',
      required: true,
      order: 1,
    },
    {
      id: generateId(),
      type: 'number',
      label: 'المستوى الدراسي',
      labelEn: 'Academic Level',
      required: true,
      order: 2,
      validation: {
        min: 1,
        max: 7,
      },
    },
  ];
}
