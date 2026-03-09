import { type ChangeEvent, useMemo, useRef, useState } from 'react';
import { Image as ImageIcon, Images, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

interface SpeakerImageFieldProps {
  value?: {
    imageMediaId?: string;
    imageUrl?: string;
  };
  onChange: (next?: { imageMediaId?: string; imageUrl?: string }) => void;
  disabled?: boolean;
}

export function SpeakerImageField({ value, onChange, disabled }: SpeakerImageFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const { mutate: uploadMedia, isPending: isUploading } = useUploadMedia();
  const { data: mediaData, isLoading: isLoadingLibrary } = useMedia({ limit: 60, page: 1 });

  const imageItems = useMemo(
    () => (mediaData?.data || []).filter((item) => item.mimeType.startsWith('image/')),
    [mediaData?.data],
  );

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    uploadMedia(file, {
      onSuccess: (uploaded) => {
        onChange({ imageMediaId: uploaded._id, imageUrl: uploaded.url });
      },
    });

    event.target.value = '';
  };

  return (
    <div className="space-y-2 rounded-md border p-3">
      <div className="mb-2 overflow-hidden rounded-md border bg-muted/20">
        {value?.imageUrl ? (
          <img src={value.imageUrl} alt="صورة المتحدث" className="h-28 w-full object-cover" />
        ) : (
          <div className="flex h-28 w-full items-center justify-center text-muted-foreground">
            <ImageIcon className="h-6 w-6" />
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
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
        >
          {isUploading ? (
            <>
              <InlineLoader className="ml-1" />
              جاري رفع الصورة...
            </>
          ) : (
            <>
              <Upload className="ml-1 h-3.5 w-3.5" />
              رفع صورة
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsLibraryOpen(true)}
          disabled={disabled}
        >
          <Images className="ml-1 h-3.5 w-3.5" />
          من المكتبة
        </Button>

        {value?.imageUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => onChange(undefined)}
            disabled={disabled}
          >
            <X className="ml-1 h-3.5 w-3.5" />
            إزالة
          </Button>
        )}
      </div>

      <Dialog open={isLibraryOpen} onOpenChange={setIsLibraryOpen}>
        <DialogContent className="max-h-[85vh] max-w-4xl overflow-hidden">
          <DialogHeader>
            <DialogTitle>اختيار صورة المتحدث</DialogTitle>
            <DialogDescription>اختر صورة من مكتبة الوسائط</DialogDescription>
          </DialogHeader>

          <div className="max-h-[65vh] overflow-y-auto p-1">
            {isLoadingLibrary ? (
              <div className="py-8 text-center text-muted-foreground">جاري تحميل مكتبة الصور...</div>
            ) : imageItems.length ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {imageItems.map((item) => {
                  const isSelected = value?.imageMediaId === item._id;

                  return (
                    <button
                      key={item._id}
                      type="button"
                      onClick={() => {
                        onChange({ imageMediaId: item._id, imageUrl: item.url });
                        setIsLibraryOpen(false);
                      }}
                      className={cn(
                        'overflow-hidden rounded-md border bg-card text-right transition-all hover:border-primary-500',
                        isSelected && 'border-primary-600 ring-1 ring-primary-600',
                      )}
                    >
                      <img src={item.url} alt={item.originalName} className="h-28 w-full object-cover" />
                      <div className="p-2">
                        <p className="truncate text-xs">{item.originalName}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">لا توجد صور حالياً في المكتبة</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
