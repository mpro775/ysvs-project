import { Award, Download, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useMyCertificates, useDownloadCertificate } from '@/api/hooks/useCertificates';
import { EmptyState } from '@/components/shared/EmptyState';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Link } from 'react-router-dom';

export default function MemberCertificatesPage() {
  const { data: certificates, isLoading } = useMyCertificates();
  const { mutate: downloadCertificate, isPending: isDownloading } = useDownloadCertificate();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (!certificates?.length) {
    return (
      <EmptyState
        icon={Award}
        title="لا توجد شهادات"
        description="ستظهر هنا شهاداتك بعد حضور المؤتمرات"
        action={{
          label: 'تصفح المؤتمرات',
          onClick: () => (window.location.href = '/events'),
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">شهاداتي</h1>

      <div className="space-y-4">
        {certificates.map((cert) => (
          <Card key={cert._id}>
            <CardContent className="flex flex-col gap-4 pt-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-amber-100 p-3">
                  <Award className="h-8 w-8 text-amber-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold">{cert.eventTitleAr}</h3>
                    <Badge variant={cert.isValid ? 'default' : 'destructive'}>
                      {cert.isValid ? 'صالحة' : 'ملغاة'}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {cert.cmeHours} ساعة تعليم طبي مستمر
                  </p>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span>
                      تاريخ الإصدار:{' '}
                      {format(new Date(cert.issueDate), 'd MMMM yyyy', { locale: ar })}
                    </span>
                    <span className="font-mono">{cert.serialNumber}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => downloadCertificate(cert._id)}
                  disabled={isDownloading || !cert.isValid}
                >
                  <Download className="ml-2 h-4 w-4" />
                  تحميل
                </Button>
                <Button variant="ghost" asChild>
                  <Link to={`/verify/${cert.serialNumber}`} className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    التحقق
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
