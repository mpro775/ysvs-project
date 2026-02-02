import { useState, useRef } from "react";
import {
  Upload,
  Trash2,
  Image,
  FileText,
  Film,
  Grid,
  List,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useMedia,
  useUploadMedia,
  useDeleteMedia,
  type MediaItem,
} from "@/api/hooks/useMedia";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";

export default function AdminMediaPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [deleteItem, setDeleteItem] = useState<MediaItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useMedia({ limit: 50 });
  const { mutate: uploadMedia, isPending: isUploading } = useUploadMedia();
  const { mutate: deleteMedia, isPending: isDeleting } = useDeleteMedia();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMedia(file);
      e.target.value = "";
    }
  };

  const handleDelete = () => {
    if (deleteItem) {
      deleteMedia(deleteItem._id, { onSuccess: () => setDeleteItem(null) });
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return <Image className="h-8 w-8" />;
    if (mimeType.startsWith("video/")) return <Film className="h-8 w-8" />;
    return <FileText className="h-8 w-8" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">مكتبة الوسائط</h1>
          <p className="text-sm text-muted-foreground">إدارة الصور والملفات</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <div className="flex rounded-lg border">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*,video/*,.pdf,.doc,.docx"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload className="ml-2 h-4 w-4" />
            {isUploading ? "جاري الرفع..." : "رفع ملف"}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div
          className={cn(
            "grid gap-4",
            viewMode === "grid"
              ? "grid-cols-2 md:grid-cols-4 lg:grid-cols-6"
              : "grid-cols-1"
          )}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton
              key={i}
              className={viewMode === "grid" ? "aspect-square" : "h-16"}
            />
          ))}
        </div>
      ) : data?.data?.length ? (
        <div
          className={cn(
            "grid gap-4",
            viewMode === "grid"
              ? "grid-cols-2 md:grid-cols-4 lg:grid-cols-6"
              : "grid-cols-1"
          )}
        >
          {data.data.map((item) => (
            <Card key={item._id} className="group overflow-hidden">
              <CardContent
                className={cn(
                  "p-0",
                  viewMode === "list" && "flex items-center gap-4 p-4"
                )}
              >
                {viewMode === "grid" ? (
                  <>
                    <div className="relative aspect-square bg-neutral-100">
                      {item.mimeType.startsWith("image/") ? (
                        <img
                          src={item.url}
                          alt={item.originalName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                          {getFileIcon(item.mimeType)}
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => setDeleteItem(item)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="p-2">
                      <p className="truncate text-xs">{item.originalName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatSize(item.size)}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex h-12 w-12 items-center justify-center rounded bg-neutral-100">
                      {item.mimeType.startsWith("image/") ? (
                        <img
                          src={item.thumbnailUrl || item.url}
                          alt={item.originalName}
                          className="h-full w-full rounded object-cover"
                        />
                      ) : (
                        getFileIcon(item.mimeType)
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.originalName}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatSize(item.size)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => setDeleteItem(item)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Image}
          title="لا توجد ملفات"
          description="لم يتم رفع أي ملفات بعد"
          action={{
            label: "رفع ملف",
            onClick: () => fileInputRef.current?.click(),
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleteItem}
        onOpenChange={() => setDeleteItem(null)}
        title="حذف الملف"
        description={`هل أنت متأكد من حذف "${deleteItem?.originalName}"؟`}
        confirmText="حذف"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
