import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { InlineLoader } from '@/components/shared/LoadingSpinner';
import { useAuthStore } from '@/stores/authStore';
import { useChangePassword } from '@/api/hooks/useAuth';
import {
  useMyProfessionalVerification,
  useUploadProfessionalVerification,
} from '@/api/hooks/useUsers';
import { ProfessionalVerificationStatus } from '@/types';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'كلمة المرور الحالية مطلوبة'),
  newPassword: z.string().min(8, 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'كلمات المرور غير متطابقة',
  path: ['confirmPassword'],
});

type PasswordForm = z.infer<typeof passwordSchema>;

export default function MemberProfilePage() {
  const { user } = useAuthStore();
  const { mutate: changePassword, isPending } = useChangePassword();
  const { data: verification } = useMyProfessionalVerification();
  const { mutate: uploadProfessionalVerification, isPending: isUploadingVerification } =
    useUploadProfessionalVerification();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit = (data: PasswordForm) => {
    changePassword(
      { currentPassword: data.currentPassword, newPassword: data.newPassword },
      { onSuccess: () => reset() }
    );
  };

  const verificationStatus =
    verification?.status ||
    user?.professionalVerification?.status ||
    ProfessionalVerificationStatus.NOT_SUBMITTED;

  const verificationStatusText: Record<ProfessionalVerificationStatus, string> = {
    [ProfessionalVerificationStatus.NOT_SUBMITTED]: 'لم يتم الرفع',
    [ProfessionalVerificationStatus.PENDING]: 'جاري المعالجة',
    [ProfessionalVerificationStatus.APPROVED]: 'موثق',
    [ProfessionalVerificationStatus.REJECTED]: 'مرفوض',
  };

  const verificationStatusVariant: Record<
    ProfessionalVerificationStatus,
    'default' | 'secondary' | 'destructive' | 'outline'
  > = {
    [ProfessionalVerificationStatus.NOT_SUBMITTED]: 'outline',
    [ProfessionalVerificationStatus.PENDING]: 'secondary',
    [ProfessionalVerificationStatus.APPROVED]: 'default',
    [ProfessionalVerificationStatus.REJECTED]: 'destructive',
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">الملف الشخصي</h1>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">المعلومات الشخصية</TabsTrigger>
          <TabsTrigger value="verification">توثيق العضوية</TabsTrigger>
          <TabsTrigger value="security">الأمان</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>معلومات الحساب</CardTitle>
              <CardDescription>معلوماتك الشخصية المسجلة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback className="bg-primary-100 text-2xl text-primary-700">
                    {user?.fullNameAr?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-bold">{user?.fullNameAr}</h3>
                  <p className="text-muted-foreground">{user?.fullNameEn}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>الاسم (عربي)</Label>
                  <Input value={user?.fullNameAr || ''} disabled />
                </div>
                <div className="space-y-2">
                  <Label>الاسم (إنجليزي)</Label>
                  <Input value={user?.fullNameEn || ''} disabled dir="ltr" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>البريد الإلكتروني</Label>
                <Input value={user?.email || ''} disabled dir="ltr" />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>رقم الهاتف</Label>
                  <Input value={user?.phone || ''} disabled dir="ltr" />
                </div>
                <div className="space-y-2">
                  <Label>التخصص</Label>
                  <Input value={user?.specialty || ''} disabled />
                </div>
              </div>

              <div className="space-y-2">
                <Label>النوع</Label>
                <Input value={user?.gender === 'male' ? 'ذكر' : user?.gender === 'female' ? 'أنثى' : ''} disabled />
              </div>

              <div className="space-y-2">
                <Label>مكان العمل</Label>
                <Input value={user?.workplace || ''} disabled />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verification" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>توثيق بطاقة مزاولة المهنة</CardTitle>
              <CardDescription>
                يمكنك رفع بطاقة مزاولة المهنة ليتم اعتماد توثيق عضويتك من الإدارة.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">الحالة:</span>
                <Badge variant={verificationStatusVariant[verificationStatus]}>
                  {verificationStatusText[verificationStatus]}
                </Badge>
              </div>

              {verification?.document?.url && (
                <div className="text-sm">
                  <a
                    href={verification.document.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary-600 hover:underline"
                  >
                    عرض الملف المرفوع ({verification.document.originalName})
                  </a>
                </div>
              )}

              {verification?.lastSubmittedAt && (
                <p className="text-xs text-muted-foreground">
                  آخر رفع: {format(new Date(verification.lastSubmittedAt), 'd MMMM yyyy', { locale: ar })}
                </p>
              )}

              {verificationStatus === ProfessionalVerificationStatus.REJECTED &&
                verification?.rejectionReason && (
                  <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                    سبب الرفض: {verification.rejectionReason}
                  </div>
                )}

              <div className="space-y-2">
                <Label htmlFor="professional-verification-upload">رفع/إعادة رفع البطاقة</Label>
                <Input
                  id="professional-verification-upload"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    uploadProfessionalVerification(file);
                    event.currentTarget.value = '';
                  }}
                  disabled={isUploadingVerification}
                />
                <p className="text-xs text-muted-foreground">
                  بعد الرفع ستتحول الحالة إلى "جاري المعالجة" حتى تتم مراجعتها من الإدارة.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>تغيير كلمة المرور</CardTitle>
              <CardDescription>قم بتحديث كلمة المرور الخاصة بك</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">كلمة المرور الحالية</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    {...register('currentPassword')}
                    className={errors.currentPassword ? 'border-destructive' : ''}
                  />
                  {errors.currentPassword && (
                    <p className="text-sm text-destructive">{errors.currentPassword.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    {...register('newPassword')}
                    className={errors.newPassword ? 'border-destructive' : ''}
                  />
                  {errors.newPassword && (
                    <p className="text-sm text-destructive">{errors.newPassword.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...register('confirmPassword')}
                    className={errors.confirmPassword ? 'border-destructive' : ''}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button type="submit" disabled={isPending}>
                  {isPending && <InlineLoader className="ml-2" />}
                  {isPending ? 'جاري تغيير كلمة المرور...' : 'تغيير كلمة المرور'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
