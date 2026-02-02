import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { Article } from '@/types';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ArticleCardProps {
  article: Article;
}

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Link to={`/news/${article.slug}`}>
      <Card className="group h-full overflow-hidden transition-shadow hover:shadow-lg">
        {/* Cover Image */}
        <div className="relative aspect-[16/9] overflow-hidden bg-neutral-100">
          {article.coverImage ? (
            <img
              src={article.coverImage}
              alt={article.titleAr}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200">
              <span className="text-4xl font-bold text-neutral-300">YSVS</span>
            </div>
          )}
        </div>

        <CardHeader className="pb-2">
          <h3 className="line-clamp-2 text-lg font-bold leading-tight transition-colors group-hover:text-primary-600">
            {article.titleAr}
          </h3>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Summary */}
          {article.summaryAr && (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {article.summaryAr}
            </p>
          )}

          {/* Date */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {format(
                new Date(article.publishedAt || article.createdAt),
                'd MMMM yyyy',
                { locale: ar }
              )}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
