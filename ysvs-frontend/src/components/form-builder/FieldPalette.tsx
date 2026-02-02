import {
  Type,
  AlignLeft,
  List,
  CheckSquare,
  Circle,
  Paperclip,
  Calendar,
  Mail,
  Phone,
  Hash,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormFieldType } from '@/types';

interface FieldPaletteProps {
  onSelect: (type: FormFieldType) => void;
  onClose: () => void;
}

const fieldTypes: { type: FormFieldType; label: string; icon: React.ReactNode }[] = [
  { type: FormFieldType.TEXT, label: 'نص قصير', icon: <Type className="h-5 w-5" /> },
  { type: FormFieldType.TEXTAREA, label: 'نص طويل', icon: <AlignLeft className="h-5 w-5" /> },
  { type: FormFieldType.SELECT, label: 'قائمة منسدلة', icon: <List className="h-5 w-5" /> },
  { type: FormFieldType.MULTISELECT, label: 'اختيار متعدد', icon: <CheckSquare className="h-5 w-5" /> },
  { type: FormFieldType.RADIO, label: 'اختيار واحد', icon: <Circle className="h-5 w-5" /> },
  { type: FormFieldType.CHECKBOX, label: 'مربع اختيار', icon: <CheckSquare className="h-5 w-5" /> },
  { type: FormFieldType.FILE, label: 'رفع ملف', icon: <Paperclip className="h-5 w-5" /> },
  { type: FormFieldType.DATE, label: 'تاريخ', icon: <Calendar className="h-5 w-5" /> },
  { type: FormFieldType.EMAIL, label: 'بريد إلكتروني', icon: <Mail className="h-5 w-5" /> },
  { type: FormFieldType.PHONE, label: 'رقم هاتف', icon: <Phone className="h-5 w-5" /> },
  { type: FormFieldType.NUMBER, label: 'رقم', icon: <Hash className="h-5 w-5" /> },
];

export function FieldPalette({ onSelect, onClose }: FieldPaletteProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm">اختر نوع الحقل</CardTitle>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {fieldTypes.map((field) => (
            <button
              key={field.type}
              type="button"
              onClick={() => onSelect(field.type)}
              className="flex flex-col items-center gap-2 rounded-lg border p-3 text-sm transition-colors hover:bg-primary-50 hover:border-primary-200"
            >
              <div className="text-primary-600">{field.icon}</div>
              <span>{field.label}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
