import { Link } from 'react-router-dom';
import { Calendar, Award, User, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/stores/authStore';
import { useMyRegistrations } from '@/api/hooks/useEvents';
import { useMyCertificates } from '@/api/hooks/useCertificates';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  ProfessionalVerificationStatus,
  type Event,
  type ProfessionalVerificationStatus as ProfessionalVerificationStatusType,
} from '@/types';

export default function MemberDashboardPage() {
  const { user } = useAuthStore();
  const { data: registrations, isLoading: loadingRegistrations } = useMyRegistrations();
  const { data: certificates, isLoading: loadingCertificates } = useMyCertificates();
  const verificationStatus =
    user?.professionalVerification?.status || ProfessionalVerificationStatus.NOT_SUBMITTED;

  const verificationStatusText: Record<ProfessionalVerificationStatusType, string> = {
    [ProfessionalVerificationStatus.NOT_SUBMITTED]: 'لم يتم رفع بطاقة مزاولة',
    [ProfessionalVerificationStatus.PENDING]: 'توثيق العضوية قيد المعالجة',
    [ProfessionalVerificationStatus.APPROVED]: 'العضوية موثقة',
    [ProfessionalVerificationStatus.REJECTED]: 'تم رفض التوثيق - يرجى إعادة الرفع',
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <Card className="bg-gradient-to-l from-primary-600 to-primary-700 text-white">
        <CardContent className="py-6">
          <h1 className="text-2xl font-bold">مرحباً، {user?.fullNameAr}</h1>
          <p className="mt-1 text-primary-100">مرحباً بك في حسابك الشخصي</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="bg-white/15 text-white">
              {verificationStatusText[verificationStatus]}
            </Badge>
            {verificationStatus !== ProfessionalVerificationStatus.APPROVED && (
              <Button size="sm" variant="secondary" asChild>
                <Link to="/member/profile">رفع بطاقة المزاولة</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-lg bg-primary-100 p-3">
              <Calendar className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{registrations?.length || 0}</p>
              <p className="text-sm text-muted-foreground">تسجيلاتي</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-lg bg-amber-100 p-3">
              <Award className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{certificates?.length || 0}</p>
              <p className="text-sm text-muted-foreground">شهاداتي</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-lg bg-green-100 p-3">
              <User className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {certificates?.reduce((acc, c) => acc + c.cmeHours, 0) || 0}
              </p>
              <p className="text-sm text-muted-foreground">ساعات CME</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Registrations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>آخر التسجيلات</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/member/events" className="flex items-center gap-1">
              عرض الكل
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {loadingRegistrations ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : registrations?.length ? (
            <div className="space-y-4">
              {registrations.slice(0, 3).map((reg) => {
                const event = reg.event as Event;
                return (
                  <div
                    key={reg._id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div>
                      <p className="font-medium">{event.titleAr}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(event.startDate), 'd MMMM yyyy', { locale: ar })}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs ${
                        reg.status === 'attended'
                          ? 'bg-green-100 text-green-700'
                          : reg.status === 'confirmed'
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      {reg.status === 'attended' ? 'حضر' : reg.status === 'confirmed' ? 'مؤكد' : 'معلق'}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">لا توجد تسجيلات</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Certificates */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>آخر الشهادات</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/member/certificates" className="flex items-center gap-1">
              عرض الكل
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {loadingCertificates ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : certificates?.length ? (
            <div className="space-y-4">
              {certificates.slice(0, 3).map((cert) => (
                <div
                  key={cert._id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <p className="font-medium">{cert.eventTitleAr}</p>
                    <p className="text-sm text-muted-foreground">
                      {cert.cmeHours} ساعة CME
                    </p>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">
                    {cert.serialNumber}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">لا توجد شهادات</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
