import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { usePrivacyPolicyPage } from '@/api/hooks/useContent';

export default function PrivacyPage() {
  const { data, isLoading, isError } = usePrivacyPolicyPage();

  return (
    <div className="container mx-auto px-4 py-10">
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <>
          <h1 className="text-3xl font-bold">{data?.titleAr || 'سياسة الخصوصية'}</h1>
          {data?.effectiveDate && (
            <p className="mt-2 text-sm text-muted-foreground">
              تاريخ السريان: {new Date(data.effectiveDate).toLocaleDateString('ar-YE')}
            </p>
          )}

          <div
            className="prose prose-slate mt-8 max-w-none leading-8"
            dir="rtl"
            dangerouslySetInnerHTML={{
              __html: data?.contentAr || '<p>لا يوجد محتوى متاح حالياً.</p>',
            }}
          />
        </>
      )}

      {isError && (
        <Alert variant="destructive" className="mt-6">
          <AlertTitle>تعذر تحميل سياسة الخصوصية</AlertTitle>
          <AlertDescription>
            لم نتمكن من جلب المحتوى حالياً، حاول مرة أخرى بعد قليل.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
