import { Link } from 'react-router-dom';
import { Home, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="mb-8">
        <span className="text-9xl font-bold text-primary-200">404</span>
      </div>
      <h1 className="mb-4 text-3xl font-bold">الصفحة غير موجودة</h1>
      <p className="mb-8 max-w-md text-muted-foreground">
        عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها إلى عنوان آخر.
      </p>
      <div className="flex gap-4">
        <Button asChild>
          <Link to="/" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            الصفحة الرئيسية
          </Link>
        </Button>
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowRight className="ml-2 h-4 w-4" />
          العودة للخلف
        </Button>
      </div>
    </div>
  );
}
