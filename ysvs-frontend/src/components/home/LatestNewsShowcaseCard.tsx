import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Article } from "@/types";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface LatestNewsShowcaseCardProps {
  article: Article;
}

function getCategoryLabel(category: unknown) {
  if (!category) return "ورش عمل";
  if (typeof category === "string") return category;
  if (typeof category === "object" && "nameAr" in category && typeof category.nameAr === "string") {
    return category.nameAr;
  }
  return "ورش عمل";
}

export function LatestNewsShowcaseCard({ article }: LatestNewsShowcaseCardProps) {
  const publishDate = article.publishedAt || article.createdAt;
  const views = (article as Article & { views?: number }).views ?? 245;
  const categoryLabel = getCategoryLabel(article.category);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#e5e8ef] bg-white shadow-[0_6px_18px_rgba(20,30,54,0.1)]">
      <div className="relative h-40 overflow-hidden bg-[#edf1fa] sm:h-44">
        {article.coverImage ? (
          <img src={article.coverImage} alt={article.titleAr} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#7a85a2]">لا توجد صورة</div>
        )}

        <Badge className="absolute right-3 top-3 border-0 bg-[#4b48d8] px-3 py-1 text-[11px] font-semibold text-white">
          {categoryLabel}
        </Badge>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 min-h-[62px] text-right text-xl font-bold leading-8 text-[#1e2438]">
          {article.titleAr}
        </h3>

        <div className="mt-3 flex items-center justify-between text-xs text-[#6c758e]">
          <span className="inline-flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5" />
            {views} مشاهدة
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {format(new Date(publishDate), "d MMMM yyyy", { locale: ar })}
          </span>
        </div>

        <Link
          to={`/news/${article.slug}`}
          className="mt-auto pt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#4c46dd] hover:text-[#3a36bc]"
        >
          اقرأ المزيد
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
