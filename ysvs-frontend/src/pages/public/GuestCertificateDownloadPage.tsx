import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Loader2, Download, CircleX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const API_URL =
  import.meta.env.VITE_API_URL || 'https://api.ysvs.smartagency-ye.com/api/v1';

export default function GuestCertificateDownloadPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    let urlToRevoke: string | null = null;

    const downloadCertificate = async () => {
      if (!token) {
        setError('رابط الشهادة غير صالح');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/certificates/guest-download?token=${encodeURIComponent(token)}`,
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || 'فشل تحميل الشهادة');
        }

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        urlToRevoke = blobUrl;
        setDownloadUrl(blobUrl);

        const anchor = document.createElement('a');
        anchor.href = blobUrl;
        anchor.download = 'ysvs-certificate.pdf';
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
      } catch (downloadError) {
        setError(
          downloadError instanceof Error
            ? downloadError.message
            : 'تعذر تحميل الشهادة. قد يكون الرابط منتهي الصلاحية',
        );
      } finally {
        setIsLoading(false);
      }
    };

    void downloadCertificate();

    return () => {
      if (urlToRevoke) {
        URL.revokeObjectURL(urlToRevoke);
      }
    };
  }, [token]);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle>تحميل شهادة المؤتمر</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>جاري تجهيز التحميل...</span>
              </div>
            ) : error ? (
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-destructive">
                  <CircleX className="mt-0.5 h-4 w-4" />
                  <p>{error}</p>
                </div>
                <Button asChild variant="outline">
                  <Link to="/verify">التحقق من الشهادة</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  تم تنزيل الشهادة تلقائياً. إذا لم يبدأ التحميل، استخدم الزر التالي.
                </p>
                <Button asChild disabled={!downloadUrl}>
                  <a href={downloadUrl || '#'} download="ysvs-certificate.pdf">
                    <Download className="ml-2 h-4 w-4" />
                    تنزيل الشهادة
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
