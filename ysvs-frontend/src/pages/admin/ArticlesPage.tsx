import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAdminArticles,
  useCategories,
  useDeleteArticle,
} from "@/api/hooks/useContent";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import type { Article } from "@/types";

export default function AdminArticlesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [deleteArticle, setDeleteArticle] = useState<Article | null>(null);
  const page = parseInt(searchParams.get("page") || "1");
  const status = searchParams.get("status") || "all";
  const featured = searchParams.get("featured") || "all";
  const category = searchParams.get("category") || "all";

  const { data, isLoading } = useAdminArticles({
    search: searchParams.get("search") || undefined,
    status: status !== "all" ? (status as "draft" | "published") : undefined,
    featured:
      featured === "true"
        ? true
        : featured === "false"
          ? false
          : undefined,
    category: category !== "all" ? category : undefined,
    page,
    limit: 10,
  });

  const { data: categories } = useCategories();

  const { mutate: deleteArticleMutation, isPending: isDeleting } =
    useDeleteArticle();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams((prev) => {
      if (search) prev.set("search", search);
      else prev.delete("search");
      prev.delete("page");
      return prev;
    });
  };

  const getCategoryName = (value: unknown) => {
    if (!value) return "-";
    if (typeof value === "string") return "-";
    if (
      typeof value === "object" &&
      "nameAr" in value &&
      typeof value.nameAr === "string"
    ) {
      return value.nameAr;
    }
    return "-";
  };

  const handleDelete = () => {
    if (deleteArticle) {
      deleteArticleMutation(deleteArticle._id, {
        onSuccess: () => setDeleteArticle(null),
      });
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6 lg:space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold leading-tight sm:text-2xl lg:text-3xl">
            إدارة الأخبار
          </h1>
          <p className="text-sm text-muted-foreground">
            إضافة وتعديل الأخبار والمقالات
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link to="/admin/articles/create">
            <Plus className="ml-2 h-4 w-4" />
            إضافة خبر
          </Link>
        </Button>
      </div>

      <form
        onSubmit={handleSearch}
        className="flex flex-col gap-2 sm:flex-row sm:gap-2"
      >
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ابحث..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>
        <Button type="submit">بحث</Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setSearch("");
            setSearchParams({ page: "1" });
          }}
        >
          إعادة تعيين
        </Button>
      </form>

      <div className="grid gap-2 sm:grid-cols-3">
        <Select
          value={status}
          onValueChange={(value) => {
            setSearchParams((prev) => {
              if (value === "all") prev.delete("status");
              else prev.set("status", value);
              prev.delete("page");
              return prev;
            });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الحالات</SelectItem>
            <SelectItem value="published">منشور</SelectItem>
            <SelectItem value="draft">مسودة</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={featured}
          onValueChange={(value) => {
            setSearchParams((prev) => {
              if (value === "all") prev.delete("featured");
              else prev.set("featured", value);
              prev.delete("page");
              return prev;
            });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="التمييز" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الأخبار</SelectItem>
            <SelectItem value="true">المميزة فقط</SelectItem>
            <SelectItem value="false">غير المميزة فقط</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={category}
          onValueChange={(value) => {
            setSearchParams((prev) => {
              if (value === "all") prev.delete("category");
              else prev.set("category", value);
              prev.delete("page");
              return prev;
            });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="التصنيف" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل التصنيفات</SelectItem>
            {categories?.map((item) => (
              <SelectItem key={item._id} value={item._id}>
                {item.nameAr}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3 md:hidden">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3 rounded-lg border bg-card p-4">
              <Skeleton className="h-5 w-4/5" />
              <Skeleton className="h-4 w-2/3" />
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
              </div>
              <Skeleton className="h-9 w-10" />
            </div>
          ))
        ) : data?.data?.length ? (
          data.data.map((article) => (
            <div key={article._id} className="space-y-3 rounded-lg border bg-card p-4">
              <div className="space-y-1">
                <h3 className="text-base font-semibold leading-6 break-words">
                  {article.titleAr}
                </h3>
                <p className="text-sm text-muted-foreground leading-6 break-words">
                  {article.titleEn}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={article.status === 'published' ? 'default' : 'secondary'}
                >
                  {article.status === 'published' ? 'منشور' : 'مسودة'}
                </Badge>
                {article.isFeatured && <Badge variant="outline">مميز</Badge>}
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground">التصنيف</p>
                  <p className="leading-6 break-words">{getCategoryName(article.category)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">تاريخ النشر</p>
                  <p>
                    {article.publishedAt
                      ? format(new Date(article.publishedAt), 'd MMM yyyy', {
                          locale: ar,
                        })
                      : '-'}
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link
                        to={`/news/${article.slug}`}
                        target="_blank"
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        عرض
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        to={`/admin/articles/${article._id}/edit`}
                        className="flex items-center gap-2"
                      >
                        <Pencil className="h-4 w-4" />
                        تعديل
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setDeleteArticle(article)}
                      className="text-destructive"
                    >
                      <Trash2 className="ml-2 h-4 w-4" />
                      حذف
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border bg-card p-2">
            <EmptyState title="لا توجد أخبار" description="لم يتم العثور على أخبار" />
          </div>
        )}
      </div>

      <div className="hidden overflow-x-auto rounded-lg border bg-card md:block">
        <Table className="min-w-[760px] xl:min-w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[42%] whitespace-normal">العنوان</TableHead>
              <TableHead>التصنيف</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>تاريخ النشر</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-5 w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-8" />
                  </TableCell>
                </TableRow>
              ))
            ) : data?.data?.length ? (
              data.data.map((article) => (
                <TableRow key={article._id}>
                  <TableCell className="max-w-[340px] whitespace-normal align-top xl:max-w-[500px]">
                    <div className="space-y-1">
                      <p className="font-medium leading-6 break-words">{article.titleAr}</p>
                      <p className="text-sm text-muted-foreground leading-6 break-words">
                        {article.titleEn}
                      </p>
                      {article.isFeatured && (
                        <Badge className="mt-1" variant="outline">
                          مميز
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getCategoryName(article.category)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        article.status === "published" ? "default" : "secondary"
                      }
                    >
                      {article.status === "published" ? "منشور" : "مسودة"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {article.publishedAt
                      ? format(new Date(article.publishedAt), "d MMM yyyy", {
                          locale: ar,
                        })
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link
                            to={`/news/${article.slug}`}
                            target="_blank"
                            className="flex items-center gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            عرض
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            to={`/admin/articles/${article._id}/edit`}
                            className="flex items-center gap-2"
                          >
                            <Pencil className="h-4 w-4" />
                            تعديل
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteArticle(article)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 ml-2" />
                          حذف
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5}>
                  <EmptyState
                    title="لا توجد أخبار"
                    description="لم يتم العثور على أخبار"
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {data?.meta && data.meta.totalPages > 1 && (
        <div className="flex flex-wrap justify-center gap-2">
          {Array.from({ length: data.meta.totalPages }).map((_, i) => (
            <Button
              key={i}
              variant={page === i + 1 ? "default" : "outline"}
              size="sm"
              onClick={() =>
                setSearchParams((prev) => {
                  prev.set("page", String(i + 1));
                  return prev;
                })
              }
            >
              {i + 1}
            </Button>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteArticle}
        onOpenChange={() => setDeleteArticle(null)}
        title="حذف الخبر"
        description={`هل أنت متأكد من حذف "${deleteArticle?.titleAr}"؟`}
        confirmText="حذف"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
