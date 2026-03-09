import { type ChangeEvent, useMemo, useRef, useState } from 'react';
import { Image as ImageIcon, Upload, Images, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useMedia, useUploadMedia } from '@/api/hooks/useMedia';
import { InlineLoader } from '@/components/shared/LoadingSpinner';

interface EventCoverImageFieldProps {
  value?: string;
  onChange: (url?: string) => void;
  disabled?: boolean;
}

export function EventCoverImageField({
  value,
  onChange,
  disabled,
}: EventCoverImageFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const { mutate: uploadMedia, isPending: isUploading } = useUploadMedia();
  const { data: mediaData, isLoading: isLoadingLibrary } = useMedia({
    limit: 60,
    page: 1,
  });

  const imageItems = useMemo(
    () =>
      (mediaData?.data || []).filter((item) =>
        item.mimeType.startsWith('image/'),
      ),
    [mediaData?.data],
  );

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    uploadMedia(file, {
      onSuccess: (uploaded) => {
        onChange(uploaded.url);
      },
    });

    event.target.value = '';
  };

  return (
    <div className="space-y-3">
      <Label>صورة غلاف المؤتمر</Label>

      <div className="rounded-lg border p-3">
        <div className="mb-3 overflow-hidden rounded-md border bg-muted/20">
          {value ? (
            <img
              src={value}
              alt="صورة غلاف المؤتمر"
              className="h-48 w-full object-cover"
            />
          ) : (
            <div className="flex h-48 w-full flex-col items-center justify-center gap-2 text-muted-foreground">
              <ImageIcon className="h-8 w-8" />
              <p className="text-sm">لا توجد صورة غلاف</p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFileChange}
          />

          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading}
          >
            {isUploading ? (
              <>
                <InlineLoader className="ml-2" />
                جاري الرفع...
              </>
            ) : (
              <>
                <Upload className="ml-2 h-4 w-4" />
                رفع مباشر
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => setIsLibraryOpen(true)}
            disabled={disabled}
          >
            <Images className="ml-2 h-4 w-4" />
            اختيار من المكتبة
          </Button>

          {value && (
            <Button
              type="button"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => onChange(undefined)}
              disabled={disabled}
            >
              <X className="ml-2 h-4 w-4" />
              إزالة الصورة
            </Button>
          )}
        </div>
      </div>

      <Dialog open={isLibraryOpen} onOpenChange={setIsLibraryOpen}>
        <DialogContent className="max-h-[85vh] max-w-4xl overflow-hidden">
          <DialogHeader>
            <DialogTitle>اختيار صورة من مكتبة الوسائط</DialogTitle>
            <DialogDescription>
              اختر صورة جاهزة لتكون صورة غلاف المؤتمر
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[65vh] overflow-y-auto p-1">
            {isLoadingLibrary ? (
              <div className="py-8 text-center text-muted-foreground">
                جاري تحميل مكتبة الصور...
              </div>
            ) : imageItems.length ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {imageItems.map((item) => {
                  const isSelected = value === item.url;

                  return (
                    <button
                      key={item._id}
                      type="button"
                      onClick={() => {
                        onChange(item.url);
                        setIsLibraryOpen(false);
                      }}
                      className={cn(
                        'overflow-hidden rounded-md border bg-card text-right transition-all hover:border-primary-500',
                        isSelected && 'border-primary-600 ring-1 ring-primary-600',
                      )}
                    >
                      <img
                        src={item.url}
                        alt={item.originalName}
                        className="h-36 w-full object-cover"
                      />
                      <div className="p-2">
                        <p className="truncate text-xs">{item.originalName}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                لا توجد صور في مكتبة الوسائط حالياً
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
