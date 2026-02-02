import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Search, CheckCircle, XCircle, Award, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useVerifyCertificate } from '@/api/hooks/useCertificates';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function VerifyPage() {
  const { serial: urlSerial } = useParams<{ serial?: string }>();
  const [searchSerial, setSearchSerial] = useState(urlSerial || '');
  const [activeSerial, setActiveSerial] = useState(urlSerial || '');

  const { data, isLoading, isError } = useVerifyCertificate(activeSerial);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSerial(searchSerial.trim());
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
            <Search className="h-8 w-8 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold">التحقق من صحة الشهادة</h1>
          <p className="mt-2 text-muted-foreground">
            أدخل الرقم التسلسلي للشهادة للتحقق من صحتها
          </p>
        </div>

        {/* Search Form */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                placeholder="أدخل الرقم التسلسلي (مثال: YSVS-2026-12345)"
                value={searchSerial}
                onChange={(e) => setSearchSerial(e.target.value)}
                className="flex-1"
                dir="ltr"
              />
              <Button type="submit" disabled={!searchSerial.trim()}>
                تحقق
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              أو امسح رمز QR الموجود على الشهادة
            </p>
          </CardContent>
        </Card>

        {/* Results */}
        {isLoading && (
          <Card>
            <CardContent className="py-12">
              <LoadingSpinner size="lg" text="جاري التحقق..." />
            </CardContent>
          </Card>
        )}

        {!isLoading && activeSerial && data && (
          <Card
            className={
              data.valid
                ? 'border-accent-500 bg-accent-50'
                : 'border-destructive bg-red-50'
            }
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {data.valid ? (
                  <>
                    <CheckCircle className="h-6 w-6 text-accent-600" />
                    <span className="text-accent-700">شهادة موثقة وصالحة</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-6 w-6 text-destructive" />
                    <span className="text-destructive">شهادة غير صالحة</span>
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.valid && data.certificate ? (
                <div className="space-y-4">
                  <div className="rounded-lg bg-white p-4">
                    <div className="mb-4 flex items-center justify-center">
                      <Award className="h-16 w-16 text-amber-500" />
                    </div>
                    <h3 className="mb-4 text-center text-xl font-bold">
                      شهادة حضور
                    </h3>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">الاسم</p>
                          <p className="font-medium">
                            {data.certificate.recipientNameAr}
                          </p>
                          <p className="text-sm text-muted-foreground" dir="ltr">
                            {data.certificate.recipientNameEn}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">المؤتمر</p>
                          <p className="font-medium">
                            {data.certificate.eventTitleAr}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Award className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">
                            ساعات التعليم الطبي المستمر
                          </p>
                          <p className="font-medium">
                            {data.certificate.cmeHours} ساعة
                          </p>
                        </div>
                      </div>

                      <div className="border-t pt-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            تاريخ الإصدار
                          </span>
                          <span>
                            {format(
                              new Date(data.certificate.issueDate),
                              'd MMMM yyyy',
                              { locale: ar }
                            )}
                          </span>
                        </div>
                        <div className="mt-2 flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            الرقم التسلسلي
                          </span>
                          <span dir="ltr" className="font-mono">
                            {data.certificate.serialNumber}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center">
                  {data.message || 'لم يتم العثور على شهادة بهذا الرقم'}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {!isLoading && activeSerial && isError && (
          <Card className="border-destructive bg-red-50">
            <CardContent className="py-8 text-center">
              <XCircle className="mx-auto h-12 w-12 text-destructive" />
              <p className="mt-4 text-destructive">
                حدث خطأ أثناء التحقق. يرجى المحاولة مرة أخرى.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
