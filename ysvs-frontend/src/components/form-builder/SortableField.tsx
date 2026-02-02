import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, Trash2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { FormField } from '@/types';
import { cn } from '@/lib/utils';

interface SortableFieldProps {
  field: FormField;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

const typeLabels: Record<string, string> = {
  text: 'نص',
  textarea: 'نص طويل',
  select: 'قائمة',
  multiselect: 'متعدد',
  checkbox: 'اختيار',
  radio: 'راديو',
  file: 'ملف',
  date: 'تاريخ',
  email: 'بريد',
  phone: 'هاتف',
  number: 'رقم',
};

export function SortableField({
  field,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
}: SortableFieldProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 rounded-lg border bg-white p-3 transition-colors',
        isSelected && 'border-primary-500 ring-1 ring-primary-500',
        isDragging && 'opacity-50'
      )}
    >
      {/* Drag Handle */}
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>

      {/* Field Info */}
      <div className="flex-1" onClick={onSelect}>
        <div className="flex items-center gap-2">
          <span className="font-medium">{field.label}</span>
          {field.required && (
            <span className="text-destructive">*</span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {typeLabels[field.type] || field.type}
          </Badge>
          {field.labelEn && (
            <span className="text-xs text-muted-foreground">{field.labelEn}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onSelect}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onDuplicate}
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
