import { useParams, Link } from 'react-router-dom';
import { ArrowRight, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useArticleBySlug } from '@/api/hooks/useContent';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function NewsDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: article, isLoading } = useArticleBySlug(slug || '');

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Skeleton className="mb-8 h-64 w-full" />
        <Skeleton className="mb-4 h-10 w-3/4" />
        <Skeleton className="h-6 w-1/3" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold">الخبر غير موجود</h1>
        <p className="mt-2 text-muted-foreground">لم يتم العثور على الخبر المطلوب</p>
        <Button asChild className="mt-4">
          <Link to="/news">العودة للأخبار</Link>
        </Button>
      </div>
    );
  }

  return (
    <article className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/news"
          className="mb-6 inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowRight className="h-4 w-4" />
          العودة للأخبار
        </Link>

        {/* Cover Image */}
        {article.coverImage && (
          <div className="mb-8 overflow-hidden rounded-xl">
            <img
              src={article.coverImage}
              alt={article.titleAr}
              className="aspect-[2/1] w-full object-cover"
            />
          </div>
        )}

        {/* Title */}
        <h1 className="mb-4 text-3xl font-bold lg:text-4xl">{article.titleAr}</h1>

        {/* Meta */}
        <div className="mb-8 flex flex-wrap gap-4 text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>
              {format(
                new Date(article.publishedAt || article.createdAt),
                'd MMMM yyyy',
                { locale: ar }
              )}
            </span>
          </div>
          {article.author && typeof article.author === 'object' && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{article.author.fullNameAr}</span>
            </div>
          )}
        </div>

        {/* Summary */}
        {article.summaryAr && (
          <p className="mb-8 text-lg leading-relaxed text-muted-foreground">
            {article.summaryAr}
          </p>
        )}

        {/* Content */}
        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: article.contentAr }}
        />
      </div>
    </article>
  );
}
