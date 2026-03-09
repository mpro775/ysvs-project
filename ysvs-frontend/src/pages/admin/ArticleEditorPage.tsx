import { useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { InlineLoader } from "@/components/shared/LoadingSpinner";
import { ArticleCoverImageField } from "@/components/articles/ArticleCoverImageField";
import {
  useArticle,
  useCreateArticle,
  useUpdateArticle,
} from "@/api/hooks/useContent";

const articleSchema = z.object({
  titleAr: z.string().min(3, "العنوان بالعربي مطلوب"),
  titleEn: z.string().min(3, "العنوان بالإنجليزي مطلوب"),
  slug: z.string().min(3, "الرابط المختصر مطلوب"),
  excerptAr: z.string().optional(),
  excerptEn: z.string().optional(),
  coverImage: z.string().url("رابط الصورة غير صالح").optional().or(z.literal("")),
  tags: z.string().optional(),
  contentAr: z.string().min(10, "المحتوى مطلوب"),
  contentEn: z.string().min(10, "المحتوى الإنجليزي مطلوب"),
  status: z.enum(["draft", "published"]),
  isFeatured: z.boolean(),
});

type ArticleForm = z.infer<typeof articleSchema>;

export default function AdminArticleEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const { data: article, isLoading } = useArticle(id || "");
  const { mutate: createArticle, isPending: isCreating } = useCreateArticle();
  const { mutate: updateArticle, isPending: isUpdating } = useUpdateArticle();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ArticleForm>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      status: "draft",
      isFeatured: false,
      coverImage: "",
      tags: "",
      excerptAr: "",
      excerptEn: "",
      contentEn: "",
    },
  });

  useEffect(() => {
    if (article) {
      reset({
        titleAr: article.titleAr,
        titleEn: article.titleEn,
        slug: article.slug,
        excerptAr: article.excerptAr || article.summaryAr || "",
        excerptEn: article.excerptEn || article.summaryEn || "",
        coverImage: article.coverImage || "",
        tags: article.tags?.join(", ") || "",
        contentAr: article.contentAr,
        contentEn: article.contentEn || "",
        status: article.status,
        isFeatured: article.isFeatured || false,
      });
    }
  }, [article, reset]);

  const watchedValues = watch();

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  };

  const onSubmit = (data: ArticleForm) => {
    const parsedTags = (data.tags || "")
      .split(/[،,]/)
      .map((tag) => tag.trim())
      .filter(Boolean);

    const payload = {
      ...data,
      excerptAr: data.excerptAr?.trim() || undefined,
      excerptEn: data.excerptEn?.trim() || undefined,
      coverImage: data.coverImage || undefined,
      tags: parsedTags.length ? parsedTags : undefined,
    };

    if (isEdit && id) {
      updateArticle(
        { id, data: payload },
        { onSuccess: () => navigate("/admin/articles") }
      );
    } else {
      createArticle(payload, { onSuccess: () => navigate("/admin/articles") });
    }
  };

  const isPending = isCreating || isUpdating;

  if (isEdit && isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/admin/articles">
            <ArrowRight className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">
            {isEdit ? "تعديل الخبر" : "إضافة خبر جديد"}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>بيانات الخبر</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="titleAr">العنوان (عربي) *</Label>
                <Input
                  id="titleAr"
                  {...register("titleAr")}
                  onChange={(e) => {
                    register("titleAr").onChange(e);
                    if (!watchedValues.slug)
                      setValue("slug", generateSlug(e.target.value));
                  }}
                  className={errors.titleAr ? "border-destructive" : ""}
                />
                {errors.titleAr && (
                  <p className="text-sm text-destructive">
                    {errors.titleAr.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="titleEn">العنوان (إنجليزي) *</Label>
                <Input
                  id="titleEn"
                  dir="ltr"
                  {...register("titleEn")}
                  className={errors.titleEn ? "border-destructive" : ""}
                />
                {errors.titleEn && (
                  <p className="text-sm text-destructive">
                    {errors.titleEn.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">الرابط المختصر *</Label>
              <Input
                id="slug"
                dir="ltr"
                {...register("slug")}
                className={errors.slug ? "border-destructive" : ""}
              />
              {errors.slug && (
                <p className="text-sm text-destructive">
                  {errors.slug.message}
                </p>
              )}
            </div>

            <ArticleCoverImageField
              value={watchedValues.coverImage || undefined}
              onChange={(url) =>
                setValue("coverImage", url || "", {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              disabled={isPending}
            />

            {errors.coverImage && (
              <p className="text-sm text-destructive">{errors.coverImage.message}</p>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="excerptAr">الملخص (عربي)</Label>
                <Textarea id="excerptAr" rows={3} {...register("excerptAr")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="excerptEn">الملخص (إنجليزي)</Label>
                <Textarea
                  id="excerptEn"
                  rows={3}
                  dir="ltr"
                  {...register("excerptEn")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">الوسوم</Label>
              <Input
                id="tags"
                placeholder="وعائي, مؤتمر, تعليم"
                {...register("tags")}
              />
              <p className="text-xs text-muted-foreground">
                افصل بين الوسوم بفاصلة (، أو ,)
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contentAr">المحتوى (عربي) *</Label>
                <Textarea
                  id="contentAr"
                  rows={12}
                  {...register("contentAr")}
                  className={errors.contentAr ? "border-destructive" : ""}
                />
                {errors.contentAr && (
                  <p className="text-sm text-destructive">
                    {errors.contentAr.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contentEn">المحتوى (إنجليزي) *</Label>
                <Textarea
                  id="contentEn"
                  rows={12}
                  dir="ltr"
                  {...register("contentEn")}
                  className={errors.contentEn ? "border-destructive" : ""}
                />
                {errors.contentEn && (
                  <p className="text-sm text-destructive">
                    {errors.contentEn.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-2">
                <Switch
                  id="status"
                  checked={watchedValues.status === "published"}
                  onCheckedChange={(checked) =>
                    setValue("status", checked ? "published" : "draft", {
                      shouldDirty: true,
                    })
                  }
                />
                <Label htmlFor="status">نشر فوري</Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="isFeatured"
                  checked={!!watchedValues.isFeatured}
                  onCheckedChange={(checked) =>
                    setValue("isFeatured", checked, {
                      shouldDirty: true,
                    })
                  }
                />
                <Label htmlFor="isFeatured">خبر مميز</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link to="/admin/articles">إلغاء</Link>
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && (
              <InlineLoader className="ml-2" />
            )}
            {isPending
              ? isEdit
                ? 'جاري حفظ التغييرات...'
                : 'جاري إنشاء الخبر...'
              : isEdit
                ? 'حفظ التغييرات'
                : 'إنشاء الخبر'}
          </Button>
        </div>
      </form>
    </div>
  );
}
